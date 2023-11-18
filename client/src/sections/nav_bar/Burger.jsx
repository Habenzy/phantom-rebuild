import { Link } from "react-router-dom";
import { useState } from "react";
import Logo from "../../assets/Logo.jpg"
import BurgerIcon from "../../assets/burgericon.jpg"



// Nav Bar functionality with links to home, about , artists, season and reserve components

const BurgerNav = (props) => {
 

  return(
    <div className="burgerNavBar">
          {/*menu */}
            <nav
            className='menu'
          >
            <li onClick={props.handleModal}><Link to="/">Home</Link></li>
            <li onClick={props.handleModal}><Link to="/About">About</Link></li>
            <li onClick={props.handleModal}><Link to="/Donate">Donate</Link></li>
            <li onClick={props.handleModal}><Link to="/Season">Season</Link></li>
            <li onClick={props.handleModal}><Link to="/AllArtist">Artists</Link></li>
            </nav>
          </div >
  )
}

// ------burger component creation
const Burger = () => {
  //-----create a variable, a toggle, and set the state of the variable to false
  const [modal, setModal] = useState(false);
  //function that will toggle the variable on and off
  const handleModal = () => {
    setModal(!modal);
  };

  //output:
  //print a div that contains a button that is a hamburger menu icon
  //add commands so that when the button is clicked, the variable will toggle on and off
  //if the variable is true, open the SidebarNav component
  //when the variable is false, close the SidebarNav component
  return (
    <div id="burgerbar">
      {/*logo */}
      <Link to="/">
      <div className='burgerLogo'>
           <img className="burgerLogoImg" src={Logo} alt="" />
      </div></Link>

      <div className="burgerDiv">
        <button id="burger" onClick={handleModal}>
              <img src={BurgerIcon} alt=""/>
        </button>

        {modal && <BurgerNav
        handleModal={handleModal} />}
      </div>
    </div>
  );
};

//------export the component---------
export default Burger;

