declare module '*.png' {
  const assetUrl: string;
  export default assetUrl;
}

declare module '*.ttf?url' {
  const src: string;
  export default src;
}
