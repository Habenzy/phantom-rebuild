import "./footer.css";
import Facebook from "../../assets/facebook.png";
import Instagram from "../../assets/instagram.png";
import PayPalDonate from "../../assets/paypal/btn_donate_LG.gif";
import { Link } from "react-router-dom";

//------------ Footer function returning Footer containing Social Media Links and Copyright Info ---------

function Footer() {
  return (
    <div className="footer">
      <div className="social_images">
        <a
          href="https://www.facebook.com/Phantom-Theater-1730271753886842/?ref=page_internal"
          target="_blank"
          rel="noreferrer noopener"
        >
          <img className="social" src={Facebook} alt="" />
        </a>
        <a href="https://www.instagram.com/phantomtheater/" target="_blank" rel="noreferrer noopener">
          <img className="social" id="insta" src={Instagram} alt="" />
        </a>

        <form
          action="https://www.paypal.com/donate"
          method="post"
          target="_top"
        >
          <input type="hidden" name="hosted_button_id" value="CU35GHQ4HTM6C" />
          <input
            alt="Donate with PayPal button"
            border="0"
            name="submit"
            src={PayPalDonate}
            title="PayPal - The safer, easier way to pay online!"
            type="image"
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
        <p>Copyright Phantom Theater 2024</p>
      </div>
      <Link to="/adminDash">Admin Login</Link>
    </div>
  );
}

//------export the component---------
export default Footer;
