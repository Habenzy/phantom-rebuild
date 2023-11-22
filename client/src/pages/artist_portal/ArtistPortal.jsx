import { useEffect, useState } from "react";
import { db, auth, storage } from "../../config/firebase";
import { createUserWithEmailAndPassword, onAuthStateChanged, sendPasswordResetEmail, signOut, signInWithEmailAndPassword } from "firebase/auth";
import { Form, Button, Card, Container } from "react-bootstrap";
import ProgressBar from "react-bootstrap/ProgressBar";

function LoginPortal(props) {

  return (
    <div>

    </div>
  )
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
    artistWebsite: "artistWebsite",
    artistFacebook: "artistFacebook",
    artistYouTube: "artistYouTube",
    artistInstagram: "artistInstagram",
    artistSpotify: "artistSpotify",
  };
  
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

  return(
    <div>

    </div>
  )
}

function ArtistProfile(props) {
  const [submitProp, setSubmitProp] = useState(false)
    //social media
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
      // get artist profile from firebase and auto populate artist form through state
    })

    useEffect(() => {
      // get all shows with artist ID attached for editing purposes
    })

  return(
    <div>
      <h1>Welcome {artist} to your Phantom Theater Artist portal</h1>
      <h3>Here you can manage your artist profile, and submit show proposals!</h3>
      <button onClick={(evt) => {evt.preventDefault(); setSubmitProp(true)}}>Create Show Proposal</button>

      {submitProp && <ProposalForm user={props.user} />}
      {/* Show/edit artist info */}
      <form>

      </form>
  {/* List all active/archived shows for artist */}

    </div>
  )
}

function ArtistPortal(props) {
  const [user, setUser] = useState(auth.user || null)

  return(
  <div>
    {!user ? <LoginPortal setUser={setUser}/> : <ArtistProfile user={user} />}
  </div>
  )
}

export default ArtistPortal