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

            broadcastEvent({
                type: 'join',
                sender: connection.peer,
                timestamp: new Date(),
            });
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

function useConnectionToDistributor(chatId: string) {
    const chatEvents = useSignal<ChatEvent[]>([]);

    // regular participant setup
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

    function sendMessage(message: string) {
        if (connectionToDistributor.value == null) {
            console.warn('cannot send message, not connected to root peer');
            return;
        }

        if (ownPeerId.value == null) {
            console.warn('cannot send message, own peer id not set');
            return;
        }

        const event = {
            type: 'message',
            message,
            sender: ownPeerId.value,
            timestamp: new Date(),
        } satisfies ChatEvent;

        connectionToDistributor.value.send(JSON.stringify(event));
    }

    return { chatEvents, sendMessage };
}

export function useChatConnection({
    chatId,
    createChatDistributor,
}: {
    chatId: string;
    createChatDistributor: boolean;
}) {
    // this setup should only run once per chat by the participant who creates the chat
    useEffect(() => {
        if (!createChatDistributor) {
            return;
        }

        return setupChatDistributor(chatId);
    }, []);

    return useConnectionToDistributor(chatId);
}
