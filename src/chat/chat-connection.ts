import { useSignal } from '@preact/signals';
import Peer, { DataConnection } from 'peerjs';
import { useEffect } from 'preact/hooks';
import { ChatEvent } from './chat-event';

// these should only be required for weird NAT configurations and are taken from the docs
// see https://peerjs.com/docs.html#api
// in general this is very questionable and stun/turn servers should be self-hosted,
// but for this tiny project i want to get away without any own servers
const commonPeerOptions = {
    config: {
        iceServers: [
            { url: 'stun:stun.l.google.com:19302' },
            { url: 'turn:turn.bistri.com:80', credential: 'homeo', username: 'homeo' },
        ],
    },
};

const distributorIdPrefix = 'space-fsoc-tp2pc-';

function chatIdToDistributorId(chatId: string) {
    return distributorIdPrefix + chatId;
}

function setupPeerDebugLogs(peer: Peer, tag: string) {
    peer.on('open', (id) => {
        console.log(`${tag} connected to brokering server with id`, id);
    });

    peer.on('connection', (connection: DataConnection) => {
        console.log(`${tag} got connection from`, connection.peer);

        connection.on('open', () => {
            console.debug(`${tag} connection opened with`, connection.peer);
        });

        connection.on('data', (data) => {
            console.debug(`${tag} got data from`, connection.peer, data);
        });

        connection.on('close', () => {
            console.debug(`${tag} connection closed with`, connection.peer);
        });

        connection.on('error', (error) => {
            console.error(`${tag} peer error`, error);
        });

        connection.on('iceStateChanged', (state) => {
            console.debug(`${tag} ice state changed`, state);
        });
    });
}

// all chat participants connect to this central distributor and send their messages to it
function setupChatDistributor(chatId: string) {
    const chatDistributorId = chatIdToDistributorId(chatId);
    const chatDistributor = new Peer(chatDistributorId, commonPeerOptions);

    setupPeerDebugLogs(chatDistributor, '[distributor]');

    const connectionsToDistributor = new Map<string, DataConnection>();

    function broadcastData(data: unknown) {
        for (const [peerId, peerConnection] of connectionsToDistributor) {
            console.debug('[distributor] broadcasting data', peerId, data);
            peerConnection.send(data);
        }
    }

    function broadcastEvent(event: ChatEvent) {
        broadcastData(JSON.stringify(event));
    }

    chatDistributor.on('open', (id) => {
        if (id !== chatDistributorId) {
            console.warn(
                `[distributor] got unexpected distributor peer id (expected ${chatDistributorId} but got ${id})`,
            );
        }
    });

    chatDistributor.on('connection', (connection: DataConnection) => {
        connection.on('open', () => {
            connectionsToDistributor.set(connection.peer, connection);

            if (connectionsToDistributor.size === 1) {
                broadcastEvent({
                    type: 'chat-created',
                    sender: connection.peer,
                    timestamp: new Date(),
                    chatId,
                });
            } else {
                broadcastEvent({
                    type: 'join',
                    sender: connection.peer,
                    timestamp: new Date(),
                });
            }
        });

        connection.on('data', (data) => {
            broadcastData(data);
        });

        connection.on('close', () => {
            connectionsToDistributor.delete(connection.peer);

            broadcastEvent({
                type: 'leave',
                sender: connection.peer,
                timestamp: new Date(),
            });
        });
    });

    return () => {
        console.debug('[distributor] cleaning up');

        chatDistributor.destroy();
    };
}

// regular participant setup
function useConnectionToDistributor(chatId: string) {
    const chatEvents = useSignal<ChatEvent[]>([]);
    const senderIdToDisplayName = useSignal<Map<string, string>>(new Map());

    const ownPeerId = useSignal<string | null>(null);
    const connectionToDistributor = useSignal<DataConnection | null>(null);
    useEffect(() => {
        const peer = new Peer(commonPeerOptions);

        setupPeerDebugLogs(peer, '[peer]');

        peer.on('open', (id) => {
            ownPeerId.value = id;

            connectionToDistributor.value = peer.connect(chatIdToDistributorId(chatId));

            connectionToDistributor.value.on('data', (data) => {
                try {
                    const event = ChatEvent.parse(JSON.parse(data as string));

                    if (event.type === 'display-name-change') {
                        senderIdToDisplayName.value = new Map(senderIdToDisplayName.value).set(
                            event.sender,
                            event.newDisplayName,
                        );
                    }

                    chatEvents.value = [...chatEvents.value, event];
                } catch (error) {
                    console.error('error parsing event', error);
                    return;
                }
            });
        });

        return () => {
            console.debug('[peer] cleaning up');

            peer.destroy();
            connectionToDistributor.value?.close();
            connectionToDistributor.value = null;
        };
    }, []);

    function sendEvent(event: ChatEvent) {
        if (connectionToDistributor.value == null) {
            console.warn('cannot send event, not connected to root peer');
            return;
        }

        connectionToDistributor.value.send(JSON.stringify(event));
    }

    function sendMessage(message: string) {
        if (ownPeerId.value == null) {
            console.warn('cannot send event, own peer id not set');
            return;
        }

        sendEvent({
            type: 'message',
            message,
            sender: ownPeerId.value,
            timestamp: new Date(),
        });
    }

    function changeDisplayName(newDisplayName: string) {
        if (ownPeerId.value == null) {
            console.warn('cannot send event, own peer id not set');
            return;
        }

        sendEvent({
            type: 'display-name-change',
            newDisplayName,
            sender: ownPeerId.value,
            timestamp: new Date(),
        });
    }

    return { chatEvents, sendMessage, changeDisplayName, senderIdToDisplayName, ownPeerId };
}

export function useChatConnection({
    chatId,
    createChatDistributor,
}: {
    chatId: string;
    createChatDistributor: boolean;
}) {
    useEffect(() => {
        // this setup should only run once per chat by the participant who creates the chat
        if (!createChatDistributor) {
            return;
        }

        return setupChatDistributor(chatId);
    }, []);

    return useConnectionToDistributor(chatId);
}
