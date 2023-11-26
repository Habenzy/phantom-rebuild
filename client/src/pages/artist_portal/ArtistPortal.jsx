import { useEffect, useState } from "react";
import { db, auth, storage } from "../../config/firebase";
import {
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  sendPasswordResetEmail,
  signOut,
  signInWithEmailAndPassword,
} from "firebase/auth";
import { Form, Button, Card, Container } from "react-bootstrap";
import ProgressBar from "react-bootstrap/ProgressBar";
import { collection, doc, query, setDoc, getDoc } from "firebase/firestore";

function LoginPortal(props) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [err, setErr] = useState(false)

  let login = async (evt) => {
    evt.preventDefault();
    try {
      let userCred = await signInWithEmailAndPassword(auth, email, password);

      props.setUser(userCred.user);
    } catch (err) {
      console.error(err);
      setErr(err.message)
    }
  };

  let signUp = async (evt) => {
    evt.preventDefault();
    try {
      let userCred = await createUserWithEmailAndPassword(
        auth,
        email,
        password
      );

      await setDoc(doc(db, artists, userCred.user.uid), {
        artist: "",
        contact:"",
        phone: "",
        email: email,
        bio: "",
        web:"",
        fb: "",
        insta: "",
        spotify: "",
        youtube: ""
      })
      props.setUser(userCred.user);
    } catch (err) {
      console.error(err);
      setErr(err.message)
    }
  };

  return (
    <div>
      <form>
        <input
          type="text"
          name="email"
          placeholder="enter your email address"
          value={email}
          onChange={(evt) => {
            setEmail(evt.target.value);
          }}
        />
        <input
          type="password"
          name="password"
          placeholder="enter your password"
          value={password}
          onChange={(evt) => {
            setPassword(evt.target.value);
          }}
        />
        <div className="login-buttons-container">
          <button className="login-button" onClick={login}>
            Log In
          </button>
          <p>
            Don't have an account?{" "}
            <button className="login-button" onClick={signUp}>
              Sign Up
            </button>
          </p>
        </div>
      </form>
      {err && <div className="err-banner">{err}</div>}
    </div>
  );
}

function ProposalForm(props) {
  let nullShow = {
    title: "title",
    type: "type",
    blurb: "blurb",
    status: "status",
    dates: [],
    artist: "artist",
    contactName: "contactName",
    phone: "phone",
    email: "email",
    bio: "bio",
    description: "description",
    imageLg: "imageLg",
    imageLgName: "imageLgName",
    image1: "image1",
    image1Name: "image1Name",
    image2: "image2",
    image2Name: "image2Name",
    image3: "image3",
    image3Name: "image3Name",
  };

  /* Example object for "dates" array
  {
    date: unix timestamp
    ticketLink: url string
    soldOut: boolean
  }
  */

  const [thisShow, setThisShow] = useState(props.show || nullShow);

  // create state objects to hold values from input form
  const [title, setTitle] = useState(props.show.title || "");
  const [blurb, setBlurb] = useState(props.show.blurb || "");
  const [type, setType] = useState(props.show.type || "");
  const [status, setStatus] = useState(props.show.status || "");
  const [dates, setDates] = useState(props.show.dates || []);

  const [description, setDescription] = useState(props.show.description || "");

  //images
  const [imageLg, setImageLg] = useState(props.show.imageLg || "");
  const [image1, setImage1] = useState(props.show.image1 || "");
  const [image2, setImage2] = useState(props.show.image2 || "");
  const [image3, setImage3] = useState(props.show.image3 || "");

  //progress bar variables
  const [progressLg, setProgressLg] = useState(0);
  const [progress1, setProgress1] = useState(0);
  const [progress2, setProgress2] = useState(0);
  const [progress3, setProgress3] = useState(0);

  return <div></div>;
}

function ArtistProfile(props) {
  const [submitProp, setSubmitProp] = useState(false);
  const [artist, setArtist] = useState("");
  const [contactName, setContactName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [bio, setBio] = useState("");
  const [artistWebsite, setArtistWebsite] = useState("");
  const [artistFacebook, setArtistFacebook] = useState("");
  const [artistYouTube, setArtistYouTube] = useState("");
  const [artistInstagram, setArtistInstagram] = useState("");
  const [artistSpotify, setArtistSpotify] = useState("");

  useEffect(() => {
    let profileRef = query(doc(db, "artists", auth.currentUser.uid))
    getDoc(profileRef).then(profile => {
      setArtist(profile.artist)
      setContactName(profile.contact)
      setPhone(profile.phone)
      setEmail(profile.email)
      setBio(profile.bio)
      setArtistWebsite(profile.web)
      setArtistFacebook(profile.fb)
      setArtistInstagram(profile.insta)
      setArtistYouTube(profile.youtube)
      setArtistSpotify(profile.spotify)
    })
  });

  useEffect(() => {
    // get all shows with artist ID attached for editing purposes
  });

  let logOut = async (evt) => {
    try{
      await signOut(auth)

      props.setUser(null)
    } catch(err) {
      console.error(err.message)
    }
  }

  return (
    <div>
      <button onClick={logOut}>Log Out</button>
      <h1>Welcome {artist} to your Phantom Theater Artist portal</h1>
      <h3>
        Here you can manage your artist profile, and submit show proposals!
      </h3>
      <button
        onClick={(evt) => {
          evt.preventDefault();
          setSubmitProp(true);
        }}
      >
        Create Show Proposal
      </button>

      {submitProp && <ProposalForm user={props.user} />}
      {/* Show/edit artist info */}
      <form></form>
      {/* List all active/archived shows for artist */}
    </div>
  );
}

function ArtistPortal(props) {
  const [user, setUser] = useState(auth.currentUser || null);

  return (
    <div>
      {!user ? (
        <LoginPortal setUser={setUser} />
      ) : (
        <ArtistProfile user={user} setUser={setUser} />
      )}
    </div>
  );
}

export default ArtistPortal;
