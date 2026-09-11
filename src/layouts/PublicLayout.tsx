import { Outlet } from "react-router-dom";
import { Navbar } from "@/features/landing/Navbar";
import { EditModeToolbar } from "@/features/landing/EditModeToolbar";

export const PublicLayout = () => {
  return (
    <>
      <Navbar />
      <Outlet />
      <EditModeToolbar />
    </>
  );
};
