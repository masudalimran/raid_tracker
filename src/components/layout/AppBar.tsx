import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import RslAccountForm from "../forms/RslAccountForm";

function AppBar() {
  const navigate = useNavigate();

  const [user, setUser] = useState<string>("");
  const supabase_auth = localStorage.getItem("supabase_auth");

  const logout = () => {
    localStorage.removeItem("supabase_auth");
    localStorage.removeItem("supabase_champion_list");
    setUser("");
    navigate("/login");
  };

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
          className="h-[50px] object-contain"
          src="https://preview.redd.it/whats-the-font-used-in-the-raid-shadow-legends-logo-v0-z3i9f5g5ray81.png?width=640&crop=smart&auto=webp&s=277b1eb73daeb7ae735ddf4b30124200a7d925d5"
          alt="raid-logo"
        ></img>
      </div>
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
  );
}

export default AppBar;
