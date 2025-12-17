function AppBar() {
    return (
        <div className="flex justify-between items-center bg-orange-100 h-[5vh]">
            <div>
                <img className="h-[50px] object-contain" src="https://preview.redd.it/whats-the-font-used-in-the-raid-shadow-legends-logo-v0-z3i9f5g5ray81.png?width=640&crop=smart&auto=webp&s=277b1eb73daeb7ae735ddf4b30124200a7d925d5" alt="raid-logo"></img>
            </div>
            <h2 className="uppercase text-2xl font-bold p-2">Raid Tracker</h2>
        </div>
    );
}

export default AppBar;
