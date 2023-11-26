import "./Footer.css";
import Facebook from "../../assets/facebook.png";
import Instagram from "../../assets/instagram.png";
import { Link } from "react-router-dom";

//------------ Footer function returning Footer containing Social Media Links and Copyright Info ---------

function Footer() {
  return (
    <div className="footer">
      <div className="social_images">
        <a
          href="https://www.facebook.com/Phantom-Theater-1730271753886842/?ref=page_internal"
          target="blank"
        >
          <img className="social" src={Facebook} alt="" />
        </a>
        <a href="https://www.instagram.com/phantomtheater/" target="blank">
          <img className="social" id="insta" src={Instagram} alt="" />
        </a>

        <form
          action="https://www.paypal.com/donate"
          method="post"
          target="_top"
        >
          <input type="hidden" name="hosted_button_id" value="CU35GHQ4HTM6C" />
          <input
            type="image"
            src="https://www.paypalobjects.com/en_US/i/btn/btn_donate_LG.gif"
            border="0"
            name="submit"
            title="PayPal - The safer, easier way to pay online!"
            alt="Donate with PayPal button"
          />
          <img
            alt=""
            border="0"
            src="https://www.paypal.com/en_US/i/scr/pixel.gif"
            width="1"
            height="1"
          />
        </form>
      </div>
      <div className="footerLinks">
        <p>Have a show proposal for us?</p>
        <Link to="/ArtistPortal">
          <button className="artist-login">
            Sign in to Your Artist Profile
          </button>
        </Link>
      </div>

      <div>
        <p>Copyright Phantom Theater 2020</p>
      </div>
      <Link to="/adminDash">Admin Login</Link>
    </div>
  );
}

//------export the component---------
export default Footer;
