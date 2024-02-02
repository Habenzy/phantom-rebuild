import { useEffect, useState } from "react";
import { db, auth, storage } from "../../config/firebase";
import {
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  sendPasswordResetEmail,
  signOut,
  signInWithEmailAndPassword,
} from "firebase/auth";
import {
  collection,
  doc,
  query,
  setDoc,
  getDoc,
  updateDoc,
  addDoc,
  where,
  getDocs,
} from "firebase/firestore";
import { getDownloadURL, ref, uploadBytes } from "firebase/storage";

const nullShow = {
  title: "title",
  type: "type",
  blurb: "blurb",
  status: "proposed",
  dates: [],
  artists: [],
  contactName: "contactName",
  phone: "phone",
  email: "email",
  bio: "bio",
  description: "description",
  imageLg: "",
  imageLgName: "",
  image2: "",
  image2Name: "",
  image3: "",
  image3Name: "",
};

function LoginPortal(props) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [err, setErr] = useState(false);

  let login = async (evt) => {
    evt.preventDefault();
    try {
      let userCred = await signInWithEmailAndPassword(auth, email, password);

      props.setUser(userCred.user);
    } catch (err) {
      console.error(err);
      setErr(err.message);
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

      await setDoc(doc(db, "artists", userCred.user.uid), {
        artist: "",
        contact: "",
        phone: "",
        email: email,
        bio: "",
        web: "",
        fb: "",
        insta: "",
        spotify: "",
        youtube: "",
      });
      props.setUser(userCred.user);
    } catch (err) {
      console.error(err);
      setErr(err.message);
    }
  };

  return (
    <div className="login-form">
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
          <p>OR</p>
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
  // create state objects to hold values from input form
  const [title, setTitle] = useState(props.show.title || "");
  const [type, setType] = useState(props.show.type || "");
  const [status, setStatus] = useState(props.show.status || "proposed");
  const [description, setDescription] = useState(props.show.description || "");
  const [contact, setContact] = useState(props.show.contactName || "");
  const [artists, setArtist] = useState([auth.currentUser.uid]);
  const [dates, setDates] = useState(props.show.dates || []);

  //images
  const [imageLg, setImageLg] = useState(props.show.imageLg || "");
  const [image2, setImage2] = useState(props.show.image2 || "");
  const [image3, setImage3] = useState(props.show.image3 || "");

  const [imgLgUrl, setImgLgUrl] = useState(props.show.imageLg || "");
  const [img2Url, setImg2Url] = useState(props.show.image2 || "");
  const [img3Url, setImg3Url] = useState(props.show.image3 || "");

  const imgUploader = async (img, targetProp) => {
    console.log("uploading image");
    console.log(img);
    const imgRef = ref(storage, img.name);
    try {
      let imgUpload = await uploadBytes(imgRef, img);
      console.log(imgUpload);
      let imgUrl = await getDownloadURL(imgUpload.ref);
      console.log(imgUrl);
      switch (targetProp) {
        case "splash":
          setImgLgUrl(imgUrl);
          break;
        case "2":
          setImg2Url(imgUrl);
          break;
        case "3":
          setImg3Url(imgUrl);
          break;
      }
      alert("Image uploaded to Database");
    } catch (err) {
      console.error(err.message);
    }
  };

  return (
    <div className="show-form-container">
      <form className="show-proposal-form">
        <label htmlFor="title">Enter the name of your show (REQUIRED)</label>
        <input
          type="text"
          name="title"
          value={title}
          onChange={(evt) => {
            setTitle(evt.target.value);
          }}
        />
        <label htmlFor="contact">
          Who is the primary contact for the show?
        </label>
        <input
          type="text"
          value={contact}
          name="contact"
          onChange={(evt) => {
            setContact(evt.target.value);
          }}
        />
        <label htmlFor="type">
          What type of show are you bringing to the barn (e.g. "dance" "theater"
          "music" etc.)
        </label>
        <input
          type="text"
          name="type"
          value={type}
          onChange={(evt) => {
            setType(evt.target.value);
          }}
        />
        <label htmlFor="description">
          Tell us a little about your show (REQUIRED)
        </label>
        <input
          type="text"
          name="description"
          value={description}
          onChange={(evt) => {
            setDescription(evt.target.value);
          }}
        />
        <label htmlFor="splash-img">
          Add a cover image to be displayed on our homepage (REQUIRED)
        </label>
        <input
          className="image-field"
          type="file"
          name="splash-img"
          onChange={(evt) => {
            const img = evt.target.files[0];
            setImageLg(img);
          }}
        />
        <button
          className={`img-uploader highlight ${
            imageLg && !imgLgUrl ? "flashing" : ""
          }`}
          onClick={(evt) => {
            evt.preventDefault();
            imgUploader(imageLg, "splash");
          }}
        >
          Upload your image to the Database (please do this <b>before</b>{" "}
          submitting the form)
        </button>
        <label htmlFor="img-2">
          Add additional images for your show (optional)
        </label>
        <input
          className="image-field"
          type="file"
          name="img-2"
          onChange={(evt) => {
            const img = evt.target.files[0];
            setImage2(img);
          }}
        />
        <button
          className={`img-uploader highlight ${
            image2 && !img2Url ? "flashing" : ""
          }`}
          onClick={(evt) => {
            evt.preventDefault();
            imgUploader(image2, "2");
          }}
        >
          Upload your image to the Database (please do this <b>before</b>{" "}
          submitting the form)
        </button>
        <label htmlFor="img-3">
          Add additional images for your show (optional)
        </label>
        <input
          className="image-field"
          type="file"
          name="img-3"
          onChange={(evt) => {
            const img = evt.target.files[0];
            setImage3(img);
          }}
        />
        <button
          className={`img-uploader highlight ${
            image3 && !img3Url ? "flashing" : ""
          }`}
          onClick={(evt) => {
            evt.preventDefault();
            imgUploader(image3, "3");
          }}
        >
          Upload your image to the Database (please do this <b>before</b>{" "}
          submitting the form)
        </button>
        <button
          className="submit-show"
          disabled={!(title && description && imgLgUrl)}
          onClick={(evt) => {
            evt.preventDefault();
            const showObj = {
              title: title,
              type: type,
              blurb: description,
              status: status,
              dates: dates,
              artists: artists,
              contactName: contact,
              description: description,
              imageLg: imgLgUrl,
              image2: img2Url,
              image3: img3Url,
            };
            props.edit
              ? setDoc(doc(db, "shows", props.show.id), showObj)
                  .then((res) => {
                    console.log(res);
                    //alert that update was successful
                    alert("Show Updated Successfully");
                  })
                  .catch((err) => {
                    console.error(err.message);
                  })
              : addDoc(collection(db, "shows"), showObj)
                  .then((res) => {
                    alert("Show added successfully");
                    props.setSubmitProp
                      ? props.setSubmitProp(false)
                      : console.log("previous show");
                  })
                  .catch((err) => {
                    console.error(err.message);
                  });
          }}
        >
          Submit your show details
        </button>
      </form>
    </div>
  );
}

function ArtistProfile(props) {
  const [submitProp, setSubmitProp] = useState(false);
  const [artist, setArtist] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [bio, setBio] = useState("");
  const [artistWebsite, setArtistWebsite] = useState("");
  const [artistFacebook, setArtistFacebook] = useState("");
  const [artistYouTube, setArtistYouTube] = useState("");
  const [artistInstagram, setArtistInstagram] = useState("");
  const [artistSpotify, setArtistSpotify] = useState("");
  const [shows, setShows] = useState([]);
  const [artistPic, setArtistPic] = useState("");
  const [picUrl, setPicUrl] = useState("");

  useEffect(() => {
    let profileRef = query(doc(db, "artists", auth.currentUser.uid));
    getDoc(profileRef).then((profile) => {
      let info = profile.data();
      setArtist(info.artist || "");
      setPhone(info.phone || "");
      setEmail(info.email || "");
      setBio(info.bio || "");
      setArtistWebsite(info.web || "");
      setArtistFacebook(info.fb || "");
      setArtistInstagram(info.insta || "");
      setArtistYouTube(info.youtube || "");
      setArtistSpotify(info.spotify || "");
      setPicUrl(info.picUrl || "");
    });
  }, []);

  useEffect(() => {
    // get all shows with artist ID attached for editing purposes
    let showsRef = query(
      collection(db, "shows"),
      where("artists", "array-contains", auth.currentUser.uid)
    );
    getDocs(showsRef).then((shows) => {
      const userShows = shows.docs.map((showData) => {
        let showInfo = showData.data();
        showInfo.id = showData.id;
        return showInfo;
      });
      console.log(userShows);
      setShows(userShows);
    });
  }, []);

  let logOut = async (evt) => {
    evt.preventDefault();
    try {
      await signOut(auth);

      props.setUser(null);
    } catch (err) {
      console.error(err.message);
    }
  };

  let updateProfile = async (evt) => {
    evt.preventDefault();

    try {
      let profRef = doc(db, "artists", auth.currentUser.uid);

      await updateDoc(profRef, {
        artist: artist,
        phone: phone,
        email: email,
        bio: bio,
        web: artistWebsite,
        fb: artistFacebook,
        insta: artistInstagram,
        spotify: artistSpotify,
        youtube: artistYouTube,
        picUrl: picUrl,
      });
    } catch (err) {
      console.error(err.message);
    }
  };

  const imgUploader = async (img) => {
    console.log("uploading image");
    console.log(img);
    const imgRef = ref(storage, img.name);
    try {
      let imgUpload = await uploadBytes(imgRef, img);
      console.log(imgUpload);
      let imgUrl = await getDownloadURL(imgUpload.ref);
      console.log(imgUrl);
      setPicUrl(imgUrl);
      alert("Image uploaded to Database");
    } catch (err) {
      console.error(err.message);
      alert("Something went wrong. Tell Bob...");
    }
  };

  return (
    <div>
      <button onClick={logOut}>Log Out</button>
      <h1>Welcome {artist} to your Phantom Theater Artist portal</h1>
      <img src={picUrl} className="profile-pic" />
      <h3>
        Here you can manage your artist profile, and submit show proposals!
      </h3>
      <button
        className="add-show-button"
        onClick={(evt) => {
          evt.preventDefault();
          setSubmitProp(true);
        }}
      >
        Create Show Proposal
      </button>

      {submitProp && (
        <ProposalForm
          user={props.user}
          show={nullShow}
          setSubmitProp={setSubmitProp}
        />
      )}
      {/* Show/edit artist info */}
      <div className="artist-container">
        <form className="artist-profile-form">
          <label htmlFor="splash-img">Upload Your Profile Picture</label>
          <input
            className="image-field"
            type="file"
            name="splash-img"
            onChange={(evt) => {
              const img = evt.target.files[0];
              setArtistPic(img);
            }}
          />
          <button
            className={`img-uploader highlight ${
              artistPic && !picUrl ? "flashing" : ""
            }`}
            onClick={(evt) => {
              evt.preventDefault();
              imgUploader(artistPic);
            }}
          >
            Upload your image to the Database (please do this <b>before</b>{" "}
            submitting the form)
          </button>
          <label htmlFor="artist">What should we call you?</label>
          <input
            name="artist"
            type="text"
            value={artist}
            onChange={(evt) => {
              setArtist(evt.target.value);
            }}
          />
          <label htmlFor="phone">
            What is a good phone number to reach you at?
          </label>
          <input
            name="phone"
            type="text"
            value={phone}
            onChange={(evt) => {
              setPhone(evt.target.value);
            }}
          />
          <label htmlFor="email">What's your primary email?</label>
          <input
            name="email"
            type="email"
            value={email}
            onChange={(evt) => {
              setEmail(evt.target.value);
            }}
          />
          <label htmlFor="bio">Tell us a little about yourself</label>
          <input
            name="bio"
            type="text"
            value={bio}
            onChange={(evt) => {
              setBio(evt.target.value);
            }}
          />
          <label htmlFor="website">
            Enter the URL for your personal website (if you have one)
          </label>
          <input
            name="website"
            type="text"
            value={artistWebsite}
            onChange={(evt) => {
              setArtistWebsite(evt.target.value);
            }}
          />
          <label htmlFor="fb">Share your facebook if you want</label>
          <input
            name="fb"
            type="text"
            value={artistFacebook}
            onChange={(evt) => {
              setArtistFacebook(evt.target.value);
            }}
          />
          <label htmlFor="insta">
            Got an instagram? We'd love to link it on your profile!
          </label>
          <input
            name="insta"
            type="text"
            value={artistInstagram}
            onChange={(evt) => {
              setArtistInstagram(evt.target.value);
            }}
          />
          <label htmlFor="spotify">
            Share your favorite tunes, link to your Spotify
          </label>
          <input
            name="spotify"
            type="text"
            value={artistSpotify}
            onChange={(evt) => {
              setArtistSpotify(evt.target.value);
            }}
          />
          <label htmlFor="youtube">
            Got a youtube channel? We can link that in too...
          </label>
          <input
            type="text"
            value={artistYouTube}
            onChange={(evt) => {
              setArtistYouTube(evt.target.value);
            }}
          />

          <button onClick={updateProfile}>Update your information</button>
        </form>
      </div>
      {/* List all active/archived shows for artist */}
      <div className="spacer"></div>
      <h1>Submitted Shows</h1>
      <div className="spacer"></div>
      {shows.map((show, i) => {
        return (
          <div key={i} className="show-container">
            <h1 className="show-title">
              {show.title} - {show.status}
            </h1>
            <ProposalForm show={show} edit={true} />
            <div className="spacer"></div>
          </div>
        );
      })}
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
