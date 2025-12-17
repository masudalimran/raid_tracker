import { Link } from "react-router-dom";

function SideNav() {
    return (
        <aside className="bg-orange-100 h-full border-t-2 border-white px-2">
            <ul
                className="[&>*>li]:cursor-pointer [&>*>li]:border-b-2 [&>*>li]:hover:border-black
                [&>*>li]:border-orange-100 [&>*>li]:w-full [&>*>li]:text-nowrap">
                <Link to="/"><li>Home</li></Link>
                <Link to="/champions"><li>Champion List</li></Link>
            </ul>
        </aside>
    );
}

export default SideNav;
