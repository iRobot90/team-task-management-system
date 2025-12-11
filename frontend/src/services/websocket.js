class WebSocketService {
  constructor() {
    this.socket = null;
    this.callbacks = [];
  }

  connect(token) {
    const protocol = window.location.protocol === 'https:' ? 'wss://' : 'ws://';
    const url = `${protocol}${window.location.host}/ws/notifications/?token=${token}`;
    
    this.socket = new WebSocket(url);

    this.socket.onopen = () => {
      console.log('WebSocket connected');
    };

    this.socket.onmessage = (event) => {
      const data = JSON.parse(event.data);
      this.callbacks.forEach(callback => callback(data));
    };

    this.socket.onclose = () => {
      console.log('WebSocket disconnected');
      // Attempt to reconnect after 5 seconds
      setTimeout(() => this.connect(token), 5000);
    };
  }

  disconnect() {
    if (this.socket) {
      this.socket.close();
    }
  }

  onNotification(callback) {
    this.callbacks.push(callback);
    return () => {
      this.callbacks = this.callbacks.filter(cb => cb !== callback);
    };
  }
}

const webSocketService = new WebSocketService();

export { webSocketService };

