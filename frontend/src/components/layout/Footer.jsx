import { Link } from "react-router-dom";
import { GraduationCap, Home, Search, Shield, UserPlus } from "lucide-react";

import { useAuth } from "../../hooks/useAuth";

function FooterColumn({ title, children }) {
  return (
    <div>
      <p className="text-sm font-semibold text-white mb-4">{title}</p>
      <ul className="space-y-2.5 text-sm text-slate-400">{children}</ul>
    </div>
  );
}

function FooterLink({ to, icon: Icon, onClick, children }) {
  const className = "flex items-center gap-2 hover:text-white transition-colors";
  if (onClick) {
    return (
      <li>
        <button type="button" onClick={onClick} className={className}>
          {Icon && <Icon className="h-3.5 w-3.5" />}
          {children}
        </button>
      </li>
    );
  }
  return (
    <li>
      <Link to={to} className={className}>
        {Icon && <Icon className="h-3.5 w-3.5" />}
        {children}
      </Link>
    </li>
  );
}

function Footer({ onSignUp }) {
  const { user } = useAuth();
  const year = new Date().getFullYear();

  return (
    <footer className="bg-slate-900 text-slate-400 mt-auto">
      <div className="h-1 bg-gradient-to-r from-indigo-500 via-violet-500 to-indigo-500" />

      <div className="max-w-6xl mx-auto px-4 sm:px-8 py-12 grid gap-10 sm:grid-cols-2 lg:grid-cols-4">
        <div className="space-y-3 sm:col-span-2 lg:col-span-1">
          <Link to="/" className="flex items-center gap-1.5 font-bold text-white text-lg">
            <GraduationCap className="h-5 w-5 text-indigo-400" />
            TeachLink
          </Link>
          <p className="text-sm text-slate-400 max-w-xs">
            A free platform to discover teachers for tuition, coaching and online classes —
            and for teachers to be found.
          </p>
        </div>

        <FooterColumn title="Explore">
          <FooterLink to="/" icon={Home}>
            Home
          </FooterLink>
          <FooterLink to="/teachers" icon={Search}>
            Find a teacher
          </FooterLink>
        </FooterColumn>

        <FooterColumn title="For teachers">
          {!user && (
            <FooterLink onClick={onSignUp} icon={UserPlus}>
              Create your profile
            </FooterLink>
          )}
          {user?.role === "TEACHER" && (
            <FooterLink to="/dashboard" icon={UserPlus}>
              My profile
            </FooterLink>
          )}
          {user?.role !== "ADMIN" && (
            <FooterLink to="/teachers" icon={Search}>
              Browse other teachers
            </FooterLink>
          )}
        </FooterColumn>

        <FooterColumn title="Account">
          {user ? (
            <FooterLink to="/requests">My requests</FooterLink>
          ) : (
            <FooterLink onClick={onSignUp}>Log in / Sign up</FooterLink>
          )}
          {user?.role === "ADMIN" && (
            <FooterLink to="/admin" icon={Shield}>
              Admin panel
            </FooterLink>
          )}
        </FooterColumn>
      </div>

      <div className="border-t border-white/10">
        <div className="max-w-6xl mx-auto px-4 sm:px-8 py-5 text-center text-xs text-slate-500">
          © {year} TeachLink. All rights reserved.
        </div>
      </div>
    </footer>
  );
}

export default Footer;
