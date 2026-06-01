// NOT CURRENTLY IN USE — retained for potential future re-enabling.
export const getShowSkillsStatus = (): boolean => {
  return !!JSON.parse(localStorage.getItem("show_skills") ?? "false");
};
