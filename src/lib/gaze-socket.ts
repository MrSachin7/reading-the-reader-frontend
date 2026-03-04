export interface GazeData {
  deviceTimeStamp: number;
  leftEyeX: number;
  leftEyeY: number;
  leftEyeValidity: string;
  rightEyeX: number;
  rightEyeY: number;
  rightEyeValidity: string;
}

type ServerEnvelope =
  | {
      type: "pong";
      sentAtUnixMs: number;
      payload: { serverTimeUnixMs: number };
    }
  | {
      type: "gazeSample";
      sentAtUnixMs: number;
      payload: GazeData;
    }
  | {
      type: "experimentStarted" | "experimentStopped" | "experimentState";
      sentAtUnixMs: number;
      payload: Record<string, unknown>;
    }
  | {
      type: "error";
      sentAtUnixMs: number;
      payload: { message: string };
    };

type ClientEnvelope =
  | { type: "ping"; payload: Record<string, never> }
  | { type: "getExperimentState"; payload: Record<string, never> };

export interface ConnectionStats {
  status: "connecting" | "open" | "closed";
  lastPongAtUnixMs: number | null;
  lastServerTimeUnixMs: number | null;
  lastRttMs: number | null;
}

type GazeListener = (data: GazeData) => void;
type StatsListener = (stats: ConnectionStats) => void;

const gazeListeners = new Set<GazeListener>();
const statsListeners = new Set<StatsListener>();

let socket: WebSocket | null = null;
let reconnectTimer: number | null = null;
let pingTimer: number | null = null;
let shouldReconnect = true;
let lastPingSentAt = 0;

let stats: ConnectionStats = {
  status: "closed",
  lastPongAtUnixMs: null,
  lastServerTimeUnixMs: null,
  lastRttMs: null,
};

function emitStats() {
  for (const listener of statsListeners) {
    listener(stats);
  }
}

function setStats(next: Partial<ConnectionStats>) {
  stats = { ...stats, ...next };
  emitStats();
}

function getWsUrl() {
  const fromEnv = process.env.NEXT_PUBLIC_WS_URL;
  if (fromEnv) {
    return fromEnv;
  }

  const isLocalhost =
    window.location.hostname === "localhost" ||
    window.location.hostname === "127.0.0.1";

  if (isLocalhost) {
    return window.location.protocol === "https:"
      ? "wss://localhost:7248/ws"
      : "ws://localhost:5190/ws";
  }

  const wsProtocol = window.location.protocol === "https:" ? "wss:" : "ws:";
  return `${wsProtocol}//${window.location.host}/ws`;
}

function send(message: ClientEnvelope) {
  if (socket?.readyState !== WebSocket.OPEN) {
    return;
  }

  socket.send(JSON.stringify(message));
}

function startPingLoop() {
  if (pingTimer !== null) {
    window.clearInterval(pingTimer);
  }

  pingTimer = window.setInterval(() => {
    lastPingSentAt = Date.now();
    send({ type: "ping", payload: {} });
  }, 5_000);
}

function stopPingLoop() {
  if (pingTimer !== null) {
    window.clearInterval(pingTimer);
    pingTimer = null;
  }
}

function scheduleReconnect() {
  if (!shouldReconnect || reconnectTimer !== null) {
    return;
  }

  reconnectTimer = window.setTimeout(() => {
    reconnectTimer = null;
    connect();
  }, 1_000);
}

function handleMessage(raw: MessageEvent<string>) {
  try {
    const message = JSON.parse(raw.data) as ServerEnvelope;

    if (message.type === "gazeSample") {
      for (const listener of gazeListeners) {
        listener(message.payload);
      }
      return;
    }

    if (message.type === "pong") {
      const now = Date.now();
      setStats({
        lastPongAtUnixMs: now,
        lastServerTimeUnixMs: message.payload.serverTimeUnixMs,
        lastRttMs: lastPingSentAt > 0 ? now - lastPingSentAt : null,
      });
      return;
    }

    if (message.type === "error") {
      console.error("WebSocket error payload:", message.payload.message);
    }
  } catch (error) {
    console.error("Failed to parse websocket message", error);
  }
}

function connect() {
  if (typeof window === "undefined") {
    return;
  }

  if (socket && (socket.readyState === WebSocket.OPEN || socket.readyState === WebSocket.CONNECTING)) {
    return;
  }

  setStats({ status: "connecting" });
  socket = new WebSocket(getWsUrl());

  socket.addEventListener("open", () => {
    setStats({ status: "open" });
    send({ type: "getExperimentState", payload: {} });
    startPingLoop();
  });

  socket.addEventListener("message", handleMessage);

  socket.addEventListener("close", () => {
    setStats({ status: "closed" });
    stopPingLoop();
    scheduleReconnect();
  });

  socket.addEventListener("error", () => {
    setStats({ status: "closed" });
  });
}

export function subscribeToGaze(listener: GazeListener) {
  gazeListeners.add(listener);
  connect();

  return () => {
    gazeListeners.delete(listener);
  };
}

export function subscribeToConnectionStats(listener: StatsListener) {
  statsListeners.add(listener);
  listener(stats);
  connect();

  return () => {
    statsListeners.delete(listener);
  };
}

export function stopGazeSocket() {
  shouldReconnect = false;
  stopPingLoop();

  if (reconnectTimer !== null) {
    window.clearTimeout(reconnectTimer);
    reconnectTimer = null;
  }

  socket?.close();
  socket = null;
}
