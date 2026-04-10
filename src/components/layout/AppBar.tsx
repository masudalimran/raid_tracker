import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import RslAccountForm from "../forms/RslAccountForm";
import { CiImageOff, CiImageOn } from "react-icons/ci";
import { getNsfwStatus } from "../../helpers/getNsfwStatus";
import { getAccountCoverage } from "../../helpers/getChampionPowerScore";
import { getShowSkillsStatus } from "../../helpers/getShowSkillsStatus";
import { GiBroadsword, GiZeusSword } from "react-icons/gi";

function AppBar() {
  const navigate = useNavigate();

  const [user, setUser] = useState<string>("");
  const [nsfw, setNsfw] = useState<boolean>(false);
  const [showSkills, setShowSkills] = useState<boolean>(false);
  const [accountCoverage, setAccountCoverage] = useState<number>(0);
  const supabase_auth = localStorage.getItem("supabase_auth");

  const logout = () => {
    localStorage.removeItem("supabase_auth");
    localStorage.removeItem("supabase_champion_list");
    setUser("");
    navigate("/login");
  };

  const handleNsfw = (isNsfw: boolean) => {
    setNsfw(isNsfw);
    localStorage.setItem("img_nsfw", isNsfw.toString());
    window.location.reload();
  };

  const handleShowSkills = (showSkills: boolean) => {
    localStorage.setItem("show_skills", showSkills.toString());
    window.location.reload();
  };

  useEffect(() => {
    const setNsfwStatusFromLocal = () => setNsfw(getNsfwStatus());
    setNsfwStatusFromLocal();

    const setShowSkillsStatusFromLocal = () =>
      setShowSkills(getShowSkillsStatus());
    setShowSkillsStatusFromLocal();

    const fetchAndSetCoverage = async () => {
      const coverage = await getAccountCoverage();
      setAccountCoverage(coverage);
    };

    fetchAndSetCoverage();
  }, []);

  useEffect(() => {
    const getUserFromLocalStorage = () => {
      if (supabase_auth) {
        const { email } = JSON.parse(supabase_auth);
        setUser(email);
      }
    };
    getUserFromLocalStorage();
  }, [supabase_auth]);

  return (
    <div className="flex justify-between items-center bg-orange-100 h-[5vh]">
      <div>
        <img
          className="h-12.5 object-contain"
          src="https://preview.redd.it/whats-the-font-used-in-the-raid-shadow-legends-logo-v0-z3i9f5g5ray81.png?width=640&crop=smart&auto=webp&s=277b1eb73daeb7ae735ddf4b30124200a7d925d5"
          alt="raid-logo"
        ></img>
      </div>
      <div className="flex justify-end items-center">
        <div
          className="border border-black rounded-r flex items-center gap-0 mr-2"
          title="% of weighted content areas covered by teams"
        >
          <p className="basic-padding-xs bg-black text-white uppercase">
            CONTENT COVERED
          </p>
          <p className="basic-padding-xs">
            {accountCoverage.toFixed(2)}%
          </p>
        </div>
        {nsfw ? (
          <CiImageOn
            onClick={() => handleNsfw(false)}
            className="cursor-pointer hover:text-gray-500 transition"
            title="Hide Image"
            size={36}
          />
        ) : (
          <CiImageOff
            onClick={() => handleNsfw(true)}
            className="cursor-pointer hover:text-gray-500 transition"
            title="Show Image"
            size={36}
          />
        )}

        {showSkills ? (
          <GiBroadsword
            onClick={() => handleShowSkills(false)}
            className="cursor-pointer hover:text-gray-500 transition"
            title="Hide Skills"
            size={30}
          />
        ) : (
          <GiZeusSword
            onClick={() => handleShowSkills(true)}
            className="cursor-pointer hover:text-gray-500 transition"
            title="Show Skills"
            size={30}
          />
        )}
        <div className="basic-padding text-right">
          {user ? (
            <RslAccountForm />
          ) : (
            <h2 className="uppercase text-2xl font-bold text-nowrap ">
              Raid Tracker
            </h2>
          )}
          {user && (
            <div className="flex-right text-xs">
              <p className="">{user}</p>
              <p>|</p>
              <div>
                <button
                  type="button"
                  className="underline cursor-pointer"
                  onClick={logout}
                >
                  Logout
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default AppBar;
