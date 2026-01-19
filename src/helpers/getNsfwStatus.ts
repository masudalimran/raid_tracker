export const getNsfwStatus = (): boolean => {
  return !!JSON.parse(localStorage.getItem("img_nsfw") ?? "false");
};
