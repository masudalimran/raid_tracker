export const getShowSkillsStatus = (): boolean => {
  return !!JSON.parse(localStorage.getItem("show_skills") ?? "false");
};
