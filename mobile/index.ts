import { registerRootComponent } from 'expo';
import App from './App';

// registerRootComponent chama AppRegistry.registerComponent('main', () => App)
// e prepara o ambiente tanto no Expo Go como numa build nativa.
registerRootComponent(App);
