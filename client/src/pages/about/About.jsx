//-------------------------------------Imports--------------------------

import Barn from "../../assets/barn4.jpg";
import Map from "../../assets/map.png";
import Tracy from "../../assets/tracyMartin.jpg";
import "./about.css";

//------About Page component function containing Phantom Theater information
// and sponsor list. -----------------------------------------------------------
function About() {
  return (
    <div className="about">
      <div className="aboutWrapper">
        <h1>About Us</h1>
        <h3 id="about_us">
          SOMETIMES FUNKY, OCCASIONALLY SHOCKING, ALWAYS ENTERTAINING, NOT TO BE
          MISSED!
        </h3>
        <div className="aboutBox1">
          <div className="aboutImgDiv1">
            <img className="aboutImage1" src={Barn} alt="" />
          </div>
          <div className="text">
            Phantom Theater was created in Warren, Vermont in 1985. Since its
            inception, Phantom has brought professional theater artists from
            Vermont as well as many cities throughout the country to act,
            direct, dance, teach workshops, and compose and play music.
            Phantom’s mission is to explore and experiment with theatrical,
            musical, and dance/movement ideas by supporting the authentic vision
            of each artist or student. The theater presents original works of
            art, serving as both a venue for polished performances and a
            laboratory for the development of new pieces.
          </div>
        </div>
        <br />
        <h4 className="barn">THE EDGCOMB BARN</h4>
        <div className="text">
          Direct from a Sears Roebuck catalog kit, the historic Edgcomb Barn is
          Phantom Theater's home. A space at once intimate and gracious, it
          brings the flavor of Vermont to all of our productions. (The
          occasional cat or bat has been known to steal a scene.) The
          surrounding grounds make an excellent place for a pre-show picnic.
        </div>

        <h4>BOARD OF DIRECTORS</h4>

        <div className="board">
          Beth Binns Schoellkopf
          <br /> Laura Brines
          <br /> Dan Eckstein <br /> Janet Hubbard-Brown <br />
          Dana Jinkins <br />
          Sheryl Kurland-Platt
          <br />
          Lexi Leacock <br /> Tracy Martin
          <br /> Mary Moffroid
          <br /> Sucosh Norton
          <br /> Julia Purinton
          <br /> Jim Sanford
          <br /> Kate Youngdahl <br /> Bob Stauss <br /> Lucas Bates <br></br>
          Mary Chris DeBelina
        </div>

        <h4>ARTISTIC DIRECTOR: Tracy Martin</h4>

        <figure>
          <img src={Tracy} alt="Tracy Martin"></img>
          <figcaption>Tracy Martin</figcaption>
        </figure>

        <div className="line"></div>
      </div>

      <div className="contactWrapper">
        <h1>Contact Us</h1>
        <div>
          <div className="aboutImgDiv2">
            {/* Actually embed a map here */}
            <img className="aboutImage2" src={Map} alt="" />
          </div>
          <br />
          PHANTOM THEATER IS LOCATED AT THE CORNER OF AIRPORT and DUMP ROADS IN
          WARREN, VERMONT. Please respect our neighbors' wishes and access
          Phantom Theater from East Warren Road.
          <br />
          <br />
          PHANTOM THEATER
          <br />
          BOX 416 WARREN, VT 05674
          <br />
          (802) 496-5997
          <br />
        </div>
        <div className="line"></div>
      </div>
    </div>
  );
}

//------export the component---------
export default About;
