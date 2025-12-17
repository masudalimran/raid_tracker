import { Route, Routes } from "react-router-dom";
import "./App.css";
import Home from "./screens/Home";
import MainLayout from "./layouts/MainLayout.tsx";
import Champions from "./screens/Champions.tsx";

function App(){
  return (
    <Routes>
        <Route element={<MainLayout />}>
            <Route path="/" element={<Home />} />
            <Route path="/champions" element={<Champions />} />
        </Route>
    </Routes>
  );
}

export default App;
