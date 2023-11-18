import Logo from "../../assets/Logo.jpg";
import "./Nav.css";
import { Link } from "react-router-dom";


//------ Nav Bar component function containing links to About, Artist, Season and Reserve pages---------
function Nav() {


  return (
    <div className="menuNavBar">
      {/*menu */}
      <nav className='menu'>
           <li><Link to="/About">About</Link></li>
         
           <li><Link to="/Donate">Donate</Link></li>
           
        <Link to="/"><div className='logo'>
          <img className="logoimg" src={Logo} alt="" />
           </div></Link>
           
           <li><Link to="/Season">Season</Link></li>
           
        <li><Link to="/AllArtist">Artists</Link></li> 
     
       
      </nav>
    </div>

  );
}

//------export the component---------
export default Nav;
