import React from 'react'
import { useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useContext } from 'react';
import { AuthContext } from './AuthContext';
import api from '../utils/axios';
import toast from 'react-hot-toast';
import { User } from 'lucide-react';
import ThemeToggle from './ThemeToggle';


const Navbar = () => {

  const location = useLocation();
  const navigate = useNavigate();

  const { user, setUser } = useContext(AuthContext);

  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [isToolsOpen, setIsToolsOpen] = useState(false);

  const logoutme = async () => {
    if (!window.confirm("Are you sure you want to logout?")) return;
    setIsLoggingOut(true);
    try {
      await api.post('/user/logout');
      localStorage.removeItem('token');
      setUser(null);
      toast.success('Logged out successfully');
      navigate('/');
    } catch (err) {
      toast.error('Failed to logout');
      setIsLoggingOut(false);
    }
  };

  const handleLogin = () => {
    navigate('/user/login', {
      state: { from: location.pathname }
    })
  }

  return (
    <div className={`navbar fixed top-0 left-0 w-full z-50 bg-[rgb(var(--navbar))] shadow-md duration-100  text-white`}>

      <div className="navbar-start">
        <div className="dropdown">
          <div tabIndex={0} role="button" className="btn btn-ghost lg:hidden">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"> <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h8m-8 6h16" /> </svg>
          </div>
          <ul
            tabIndex="-1"
            className={`menu menu-sm dropdown-content  rounded-box z-1 mt-3 w-52 p-2 shadow text-white bg-[rgb(var(--navbar))]`}>
            <li><button onClick={() => navigate('/')} >Home</button></li>
            <li><button onClick={() => navigate('/exercises')} >Exercises</button></li>
            <li>
              <details>
                <summary>Tools</summary>
                <ul className="p-2 bg-[rgb(var(--navbar))] w-40 z-1 ">
                  <li><button onClick={() => navigate('/calorie-calculator')}>Calorie calculator</button></li>
                  <li><button onClick={() => navigate('/bmi-calculator')}>BMI calculator</button></li>
                  <li><button onClick={() => navigate('/exercise-selector')}>Exercise Selector</button></li>
                  <li><button onClick={() => navigate('/daily-tracker')}>Daily Tracker</button></li>
                </ul>
              </details>
            </li>
            <li><button onClick={() => navigate('/contact-us')}>Contact Us</button></li>
          </ul>
        </div>
        <button className={`btn btn-ghost text-xl hover:bg-[rgb(var(--navbar-hover))] hover:border-none`} onClick={() => navigate('/')}>FitBuddy</button>
      </div>
      <div className="navbar-center hidden lg:flex">
        <ul className={`menu menu-horizontal px-1 `}>
          {/* <li><a href='/'>Home</a></li> */}
          <li><button onClick={() => navigate('/')} >Home</button></li>
          <li><button onClick={() => navigate('/exercises')} >Exercises</button></li>
          {/* <li><a href='/exercises'>Exercises</a></li> */}
          <li className="relative" onMouseEnter={() => setIsToolsOpen(true)} onMouseLeave={() => setIsToolsOpen(false)}>
            <button>Tools</button>
            {isToolsOpen && (
              <ul className="absolute top-full left-0 p-2 bg-[rgb(var(--navbar))] w-40 z-1 transition-opacity duration-200">
                <li><button onClick={() => navigate('/calorie-calculator')}>Calorie calculator</button></li>
                <li><button onClick={() => navigate('/bmi-calculator')}>BMI calculator</button></li>
                <li><button onClick={() => navigate('/exercise-selector')}>Exercise Selector</button></li>
                <li><button onClick={() => navigate('/daily-tracker')}>Daily Tracker</button></li>
              </ul>
            )}
          </li>
          <li><button onClick={() => navigate('/contact-us')}>Contact Us</button></li>
        </ul>
      </div>

      <div className="navbar-end">
        <div className="mr-2">
          <ThemeToggle className="text-white" />
        </div>

        {user ? (
          <>
            <button
              onClick={logoutme}
              disabled={isLoggingOut}
              className="btn bg-red-500 text-white ml-2 hover:bg-red-600 disabled:opacity-50"
            >
              {isLoggingOut ? 'Logging out...' : 'Logout'}
            </button>

            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-orange-500 to-red-600 flex items-center justify-center text-white ml-4 flex-shrink-0">
              {user.profilePicture ? (
                <img
                  src={user.profilePicture}
                  alt="Profile"
                  className="h-full w-full rounded-full object-cover cursor-pointer"
                  onClick={() => navigate('/dashboard')}
                />
              ) : (
                <User size={20} className="cursor-pointer" onClick={() => navigate('/dashboard')} />
              )}
            </div>
          </>
        ) : (
          <button
            className="btn bg-blue-700 text-white ml-4 hover:bg-blue-900"
            onClick={handleLogin}
          >
            Login / Signup
          </button>
        )}
      </div>
    </div>
  )
}

export default Navbar
