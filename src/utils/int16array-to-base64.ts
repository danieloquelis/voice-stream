export const int16ArrayToBase64 = (buffer: Int16Array): string => {
  let binary = "";
  const bytes = new Uint8Array(buffer.buffer);
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
};
