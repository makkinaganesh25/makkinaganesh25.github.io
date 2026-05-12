export interface SectionRange {
  start: number;
  end: number;
}

export interface HomeSceneRanges {
  projects: SectionRange;
  experience: SectionRange;
  education: SectionRange;
  contact: SectionRange;
}

export type SceneTone = "emerald" | "blue" | "amber" | "scarlet";

export interface SceneLane {
  points: [number, number, number][];
  tone: SceneTone;
  radius: number;
  packetOffsets: number[];
  packetSpeed: number;
  emphasis?: "primary" | "support";
}

export interface SceneLabel {
  label: string;
  position: [number, number, number];
  tone: SceneTone;
}

export interface ScenePlate {
  position: [number, number, number];
  size: [number, number, number];
  tone: SceneTone;
}

export interface SceneFramePlane {
  position: [number, number, number];
  rotation: [number, number, number];
  size: [number, number];
  tone: SceneTone;
}

export interface SceneHalo {
  position: [number, number, number];
  rotation: [number, number, number];
  radius: number;
  tone: SceneTone;
}

export const defaultHomeSceneRanges: HomeSceneRanges = {
  projects: { start: 0.42, end: 0.62 },
  experience: { start: 0.6, end: 0.79 },
  education: { start: 0.75, end: 0.88 },
  contact: { start: 0.85, end: 0.98 },
};

export const homeSceneTuning = {
  mobileBreakpoint: 768,
  tabletBreakpoint: 1024,
} as const;

export const homeSceneData = {
  projects: {
    focalOffset: [0, -0.8, 0] as const,
    lanes: [
      {
        points: [
          [-5.7, 1.55, -5.9],
          [-3.8, 1.2, -3.5],
          [-1.4, 0.76, -1.1],
          [1.1, 0.34, 1.35],
          [4.7, -0.02, 4.65],
        ],
        tone: "blue",
        radius: 0.022,
        packetOffsets: [0.08, 0.46, 0.8],
        packetSpeed: 0.022,
        emphasis: "primary",
      },
      {
        points: [
          [-5.9, 0.18, -5.25],
          [-3.9, 0.14, -2.8],
          [-1.25, -0.04, -0.25],
          [1.05, -0.22, 1.95],
          [4.35, -0.42, 4.95],
        ],
        tone: "emerald",
        radius: 0.024,
        packetOffsets: [0.16, 0.54, 0.88],
        packetSpeed: 0.019,
        emphasis: "primary",
      },
      {
        points: [
          [-5.05, -1.22, -5.1],
          [-3.15, -0.94, -2.45],
          [-0.7, -0.45, 0.1],
          [1.28, 0.12, 2.45],
          [3.95, 0.52, 5.05],
        ],
        tone: "amber",
        radius: 0.026,
        packetOffsets: [0.28, 0.7],
        packetSpeed: 0.017,
        emphasis: "primary",
      },
      {
        points: [
          [-4.5, 2.05, -4.55],
          [-2.25, 1.48, -1.75],
          [0.25, 0.82, 0.8],
          [2.05, 0.3, 2.6],
          [4.08, -0.12, 4.6],
        ],
        tone: "blue",
        radius: 0.016,
        packetOffsets: [0.32, 0.78],
        packetSpeed: 0.015,
        emphasis: "support",
      },
    ] satisfies SceneLane[],
    labels: [
      { label: "SQL", position: [-5.05, 2.45, -5.15], tone: "blue" },
      { label: "Kafka", position: [-4.7, 0.82, -4.05], tone: "amber" },
      { label: "Spark", position: [-1.7, 2.1, -1.45], tone: "emerald" },
      { label: "Airflow", position: [2.28, 1.38, 1.2], tone: "blue" },
      { label: "dbt", position: [0.45, -1.42, 1.62], tone: "emerald" },
      { label: "Databricks", position: [3.72, 1.78, 3.55], tone: "amber" },
      { label: "Delta Lake", position: [3.2, 0.22, 4.45], tone: "blue" },
      { label: "Lakehouse", position: [3.35, -1.28, 5.2], tone: "emerald" },
    ] satisfies SceneLabel[],
    tierPlanes: [
      { position: [0.6, -1.02, 1.15], size: [5.2, 0.08, 3.6], tone: "amber" },
      { position: [0.9, -0.22, 1.95], size: [4.15, 0.08, 2.9], tone: "emerald" },
      { position: [1.08, 0.56, 2.62], size: [3.1, 0.08, 2.25], tone: "blue" },
    ] satisfies ScenePlate[],
    nodes: [
      [-3.72, 1.08, -3.05],
      [-1.15, 0.38, -0.55],
      [1.18, -0.06, 1.62],
      [3.48, -0.1, 3.92],
    ] as const,
    halos: [
      { position: [0.62, -0.18, 1.52], rotation: [1.25, 0.08, -0.16], radius: 2.85, tone: "emerald" },
      { position: [1.72, 0.74, 2.84], rotation: [1.16, -0.18, 0.18], radius: 2.1, tone: "blue" },
    ] satisfies SceneHalo[],
  },
  experience: {
    focalOffset: [0, -1.0, 0] as const,
    labels: [
      { label: "CI/CD", position: [-4.18, 2.28, -3.7], tone: "blue" },
      { label: "MLflow", position: [-1.52, 1.72, -0.92], tone: "emerald" },
      { label: "Data Contracts", position: [1.95, 2.04, 1.18], tone: "amber" },
      { label: "Observability", position: [3.88, 0.92, 3.58], tone: "blue" },
      { label: "Reliability", position: [2.58, -1.14, 3.86], tone: "emerald" },
    ] satisfies SceneLabel[],
    nodes: [
      [-4.25, 1.58, -3.84],
      [-2.68, 1.86, -2.02],
      [-1.02, 1.12, -0.42],
      [0.92, 1.18, 0.98],
      [2.52, 0.68, 2.58],
      [4.02, 0.15, 4.38],
      [1.62, -1.02, 2.58],
      [-0.82, -0.94, 0.22],
    ] as const,
    connections: [
      [0, 1],
      [1, 2],
      [2, 3],
      [3, 4],
      [4, 5],
      [2, 7],
      [7, 6],
      [6, 4],
    ] as const,
    rails: [
      {
        points: [
          [-5.55, 2.04, -4.4],
          [-2.85, 1.54, -1.92],
          [-0.45, 1.18, 0.18],
          [2.08, 0.94, 2.08],
          [4.82, 0.56, 4.42],
        ],
        tone: "blue",
        radius: 0.018,
        packetOffsets: [0.18, 0.64],
        packetSpeed: 0.014,
        emphasis: "primary",
      },
      {
        points: [
          [-5.15, -1.46, -3.2],
          [-2.58, -1.18, -1.08],
          [-0.08, -0.82, 0.82],
          [2.12, -0.5, 2.52],
          [4.78, -0.16, 4.9],
        ],
        tone: "emerald",
        radius: 0.02,
        packetOffsets: [0.28, 0.74],
        packetSpeed: 0.012,
        emphasis: "support",
      },
    ] satisfies SceneLane[],
    latticePlanes: [
      { position: [0.52, 0.68, 0.92], rotation: [1.22, 0.14, 0.08], size: [7.6, 4.9], tone: "emerald" },
      { position: [1.35, -0.06, 2.5], rotation: [1.08, -0.18, -0.06], size: [6.1, 3.7], tone: "blue" },
    ] satisfies SceneFramePlane[],
    halos: [
      { position: [0.82, 0.78, 1.62], rotation: [1.18, 0.22, 0.16], radius: 2.4, tone: "emerald" },
      { position: [2.36, 0.24, 2.98], rotation: [1.32, -0.16, -0.12], radius: 1.84, tone: "blue" },
    ] satisfies SceneHalo[],
  },
  education: {
    focalOffset: [0.08, -0.5, 0] as const,
    coreOffset: [0.05, -0.08, -3.2] as const,
    coreRotation: [0.04, -0.18, -0.04] as const,
    latticePlanes: [
      { position: [0.1, 0.14, -9.6], rotation: [1.18, 0.12, 0.06], size: [8.6, 3.5], tone: "scarlet" },
      { position: [0.2, -0.5, -3.8], rotation: [1.34, -0.08, -0.04], size: [5.8, 2.6], tone: "blue" },
    ] satisfies SceneFramePlane[],
    halos: [
      { position: [0.18, 0.34, -12.4], rotation: [1.14, 0.1, 0.05], radius: 4.2, tone: "scarlet" },
      { position: [-0.1, -0.18, -4.8], rotation: [1.28, -0.08, -0.1], radius: 2.65, tone: "blue" },
    ] satisfies SceneHalo[],
    ribbons: [
      {
        points: [
          [-2.1, -0.54, -18.2],
          [-1.5, -0.18, -12.0],
          [-0.9, 0.2, -6.1],
          [-0.24, 0.56, -0.8],
          [0.62, 1.0, 4.8],
        ],
        tone: "scarlet",
        radius: 0.02,
        packetOffsets: [0.22, 0.68],
        packetSpeed: 0.014,
        emphasis: "primary",
      },
      {
        points: [
          [2.25, -0.5, -17.6],
          [1.62, -0.14, -11.4],
          [1.02, 0.18, -5.6],
          [0.36, 0.5, -0.3],
          [-0.62, 0.9, 5.0],
        ],
        tone: "blue",
        radius: 0.024,
        packetOffsets: [0.15, 0.7],
        packetSpeed: 0.012,
        emphasis: "support",
      },
      {
        points: [
          [0.16, -0.92, -15.8],
          [0.2, -0.46, -10.6],
          [0.24, 0.02, -5.2],
          [0.16, 0.45, 0.0],
          [-0.16, 0.92, 5.6],
        ],
        tone: "scarlet",
        radius: 0.015,
        packetOffsets: [0.4, 0.85],
        packetSpeed: 0.016,
        emphasis: "support",
      },
    ] satisfies SceneLane[],
    nodes: [
      [-3.0, 1.0, -12.6],
      [2.8, 0.72, -9.8],
      [-2.0, -0.62, -5.4],
      [2.1, -0.82, -2.6],
    ] as const,
  },
  contact: {
    focalOffset: [0, -0.6, 0] as const,
    signalLines: [
      {
        points: [
          [-3.0, 0.96, -2.6],
          [-1.35, 0.62, -1.3],
          [0.1, 0.36, 0.0],
          [1.72, 0.08, 1.34],
          [3.05, -0.18, 2.5],
        ],
        tone: "blue",
        radius: 0.01,
        packetOffsets: [0.12],
        packetSpeed: 0.008,
        emphasis: "primary",
      },
      {
        points: [
          [-2.62, -0.72, -2.0],
          [-1.18, -0.46, -0.84],
          [0.18, -0.2, 0.22],
          [1.32, 0.1, 1.16],
          [2.58, 0.42, 2.0],
        ],
        tone: "emerald",
        radius: 0.008,
        packetOffsets: [0.46],
        packetSpeed: 0.006,
        emphasis: "support",
      },
      {
        points: [
          [-2.28, 1.32, -1.1],
          [-0.86, 0.96, -0.2],
          [0.58, 0.54, 0.72],
          [1.82, 0.16, 1.56],
        ],
        tone: "amber",
        radius: 0.006,
        packetOffsets: [0.7],
        packetSpeed: 0.005,
        emphasis: "support",
      },
    ] satisfies SceneLane[],
    particles: [
      [-1.95, 1.32, -1.5],
      [-1.28, -0.72, -0.28],
      [-0.4, 0.9, 0.42],
      [0.45, 1.1, 1.18],
      [1.26, -0.96, 1.54],
      [1.92, 0.42, 2.05],
      [0.78, 1.74, -0.45],
      [-1.82, 0.08, 1.18],
      [2.2, -0.24, 0.28],
      [0.18, -1.38, 2.28],
    ] as const,
  },
} as const;
