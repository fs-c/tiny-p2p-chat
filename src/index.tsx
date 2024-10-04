import './style.css';

import { Home } from './components/Home';
import { Chat } from './components/Chat';
import { render } from 'preact';
import { LocationProvider, Route, Router } from 'preact-iso';

export function App() {
    return (
        <LocationProvider>
            <Router>
                {/* @ts-ignore the preact-iso types suck apparently */}
                <Route path={'/'} component={Home} />
                {/* @ts-ignore the preact-iso types suck apparently */}
                <Route path={'/chat/:chatId'} component={Chat} />
            </Router>
        </LocationProvider>
    );
}

const appContainer = document.getElementById('app');
if (appContainer == null) {
    throw new Error('no app container element found');
}

render(<App />, appContainer);
