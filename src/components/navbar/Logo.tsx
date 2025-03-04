
import { Link } from "react-router-dom";

export const Logo = () => {
  return (
    <Link to="/" className="flex items-center gap-2">
      <img 
        src="https://i.ibb.co/Mkv44CY8/7c232e-500-x-100-px-1.png" 
        alt="BoneHeal" 
        className="h-10"
      />
    </Link>
  );
};
