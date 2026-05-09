import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ChevronDown, LogOut, User as UserIcon, Settings as SettingsIcon, KeyRound, LayoutGrid, CheckCircle2 } from "lucide-react";
import { useAuth } from "@/lib/auth";
import { initials } from "@/lib/format";
import {
  DropdownMenu, DropdownMenuTrigger, DropdownMenuContent,
  DropdownMenuItem, DropdownMenuSeparator, DropdownMenuLabel,
  DropdownMenuCheckboxItem,
} from "@/components/ui/dropdown-menu";
import { toast } from "sonner";

export default function UserMenu() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [rememberPortal, setRememberPortal] = useState(() => {
    return localStorage.getItem("aurora_remember_last_portal") === "true";
  });
  
  if (!user) return null;

  const handleLogout = async () => {
    await logout();
    navigate("/login", { replace: true });
  };

  const handleSwitchPortal = () => {
    navigate("/portal-select");
  };
  
  const toggleRememberPortal = () => {
    const newValue = !rememberPortal;
    setRememberPortal(newValue);
    localStorage.setItem("aurora_remember_last_portal", String(newValue));
    toast.success(
      newValue 
        ? "Portal terakhir akan diingat saat login" 
        : "Portal selection akan ditampilkan saat login"
    );
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          className="flex items-center gap-2 h-10 pl-2 pr-3 rounded-full glass-input hover:bg-foreground/5 transition-colors"
          data-testid="user-menu-trigger"
        >
          <div className="h-7 w-7 rounded-full grad-aurora flex items-center justify-center text-white text-xs font-bold">
            {initials(user.full_name)}
          </div>
          <span className="hidden md:block text-sm font-medium max-w-[120px] truncate">
            {user.full_name}
          </span>
          <ChevronDown className="h-3 w-3 text-muted-foreground hidden md:block" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56 glass-card">
        <DropdownMenuLabel className="font-normal">
          <div className="flex flex-col">
            <span className="text-sm font-semibold truncate">{user.full_name}</span>
            <span className="text-xs text-muted-foreground truncate">{user.email}</span>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem className="cursor-pointer">
          <UserIcon className="h-4 w-4 mr-2" /> Profile
        </DropdownMenuItem>
        <DropdownMenuItem className="cursor-pointer">
          <KeyRound className="h-4 w-4 mr-2" /> Change Password
        </DropdownMenuItem>
        <DropdownMenuItem className="cursor-pointer">
          <SettingsIcon className="h-4 w-4 mr-2" /> Preferences
        </DropdownMenuItem>
        <DropdownMenuCheckboxItem
          checked={rememberPortal}
          onCheckedChange={toggleRememberPortal}
          className="cursor-pointer"
        >
          <CheckCircle2 className="h-4 w-4 mr-2" /> Remember Last Portal
        </DropdownMenuCheckboxItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onClick={handleSwitchPortal}
          className="cursor-pointer"
          data-testid="topnav-switch-portal-menu-item"
        >
          <LayoutGrid className="h-4 w-4 mr-2" /> Switch Portal
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onClick={handleLogout}
          className="cursor-pointer text-destructive focus:text-destructive"
          data-testid="logout-button"
        >
          <LogOut className="h-4 w-4 mr-2" /> Logout
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
