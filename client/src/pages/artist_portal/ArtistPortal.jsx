import { useEffect, useId, useState } from "react";
import PropTypes from "prop-types";
import { db, auth, storage } from "../../config/firebase";
import {
  createUserWithEmailAndPassword,
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
import { uploadUserImage } from "../../utils/imageUpload";
import { nullShow, showPropType } from "../portals/portalTypes";
import "./artist_portal.css";

function LoginPortal({ setUser }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [err, setErr] = useState(false);

  let login = async (evt) => {
    evt.preventDefault();
    try {
      let userCred = await signInWithEmailAndPassword(auth, email, password);

      setUser(userCred.user);
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
      setUser(userCred.user);
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
            Don&apos;t have an account?{" "}
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

LoginPortal.propTypes = {
  setUser: PropTypes.func.isRequired,
};

function ProposalForm({ show, edit = false, setSubmitProp }) {
  const formId = useId();
  const idFor = (fieldName) => `${formId}-${fieldName}`;
  // create state objects to hold values from input form
  const [title, setTitle] = useState(show.title || "");
  const [type, setType] = useState(show.type || "");
  const status = show.status || "proposed";
  const [description, setDescription] = useState(show.description || "");
  const [contact, setContact] = useState(show.contactName || "");
  const artists = [auth.currentUser.uid];
  const dates = show.dates || [];

  //images
  const [imageLg, setImageLg] = useState("");
  const [image2, setImage2] = useState("");
  const [image3, setImage3] = useState("");

  const [imgLgUrl, setImgLgUrl] = useState(show.imageLg || "");
  const [img2Url, setImg2Url] = useState(show.image2 || "");
  const [img3Url, setImg3Url] = useState(show.image3 || "");

  const imgUploader = async (img, targetProp) => {
    try {
      const imgUrl = await uploadUserImage({
        storage,
        uid: auth.currentUser?.uid,
        file: img,
      });

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
      alert(err.message);
    }
  };

  return (
    <div className="show-form-container">
      <div className="spacer"></div>
      <form
        className="show-proposal-form"
        data-testid={edit ? `artist-edit-show-form-${show.id}` : "artist-proposal-form"}
      >
        <label htmlFor={idFor("title")}>Enter the name of your show (REQUIRED)</label>
        <input
          id={idFor("title")}
          type="text"
          name="title"
          value={title}
          onChange={(evt) => {
            setTitle(evt.target.value);
          }}
        />
        <label htmlFor={idFor("contact")}>
          Who is the primary contact for the show?
        </label>
        <input
          id={idFor("contact")}
          type="text"
          value={contact}
          name="contact"
          onChange={(evt) => {
            setContact(evt.target.value);
          }}
        />
        <label htmlFor={idFor("type")}>
          What type of show are you bringing to the barn (e.g. &quot;dance&quot;
          &quot;theater&quot; &quot;music&quot; etc.)
        </label>
        <input
          id={idFor("type")}
          type="text"
          name="type"
          value={type}
          onChange={(evt) => {
            setType(evt.target.value);
          }}
        />
        <label htmlFor={idFor("description")}>
          Show description for internal use. What&apos;s the run time, major
          themes, target demographic, etc? (REQUIRED)
        </label>
        <input
          id={idFor("description")}
          type="text"
          name="description"
          value={description}
          onChange={(evt) => {
            setDescription(evt.target.value);
          }}
        />
        <label htmlFor={idFor("splash-img")}>
          Add a cover image to be displayed on our homepage, only use wordless
          images please! (REQUIRED)
        </label>
        <input
          id={idFor("splash-img")}
          className="image-field"
          type="file"
          accept="image/*"
          name="splash-img"
          data-testid={edit ? "artist-edit-cover-upload" : "artist-proposal-cover-upload"}
          onChange={(evt) => {
            const img = evt.target.files[0];
            setImageLg(img);
          }}
        />
        <button
          data-testid={
            edit ? "artist-edit-cover-upload-button" : "artist-proposal-cover-upload-button"
          }
          className={`img-uploader highlight ${
            imageLg && !imgLgUrl ? "flashing" : ""
          }`}
          disabled={!imageLg}
          onClick={(evt) => {
            evt.preventDefault();
            imgUploader(imageLg, "splash");
          }}
        >
          Upload your image to the Database (please do this <b>before</b>{" "}
          submitting the form)
        </button>
        <label htmlFor={idFor("img-2")}>
          Add additional images for your show (optional)
        </label>
        <input
          id={idFor("img-2")}
          className="image-field"
          type="file"
          accept="image/*"
          name="img-2"
          data-testid={edit ? "artist-edit-second-upload" : "artist-proposal-second-upload"}
          onChange={(evt) => {
            const img = evt.target.files[0];
            setImage2(img);
          }}
        />
        <button
          data-testid={
            edit ? "artist-edit-second-upload-button" : "artist-proposal-second-upload-button"
          }
          className={`img-uploader highlight ${
            image2 && !img2Url ? "flashing" : ""
          }`}
          disabled={!image2}
          onClick={(evt) => {
            evt.preventDefault();
            imgUploader(image2, "2");
          }}
        >
          Upload your image to the Database (please do this <b>before</b>{" "}
          submitting the form)
        </button>
        <label htmlFor={idFor("img-3")}>
          Add additional images for your show (optional)
        </label>
        <input
          id={idFor("img-3")}
          className="image-field"
          type="file"
          accept="image/*"
          name="img-3"
          data-testid={edit ? "artist-edit-third-upload" : "artist-proposal-third-upload"}
          onChange={(evt) => {
            const img = evt.target.files[0];
            setImage3(img);
          }}
        />
        <button
          data-testid={
            edit ? "artist-edit-third-upload-button" : "artist-proposal-third-upload-button"
          }
          className={`img-uploader highlight ${
            image3 && !img3Url ? "flashing" : ""
          }`}
          disabled={!image3}
          onClick={(evt) => {
            evt.preventDefault();
            imgUploader(image3, "3");
          }}
        >
          Upload your image to the Database (please do this <b>before</b>{" "}
          submitting the form)
        </button>
        <button
          data-testid={edit ? "artist-edit-submit" : "artist-proposal-submit"}
          className={`submit-show ${
            title && description && imgLgUrl && "flashing"
          }`}
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
            edit
              ? setDoc(doc(db, "shows", show.id), showObj)
                  .then(() => {
                    //alert that update was successful
                    alert("Show Updated Successfully");
                  })
                  .catch((err) => {
                    console.error(err.message);
                  })
              : addDoc(collection(db, "shows"), showObj)
                  .then(() => {
                    alert("Show added successfully");
                    setSubmitProp
                      ? setSubmitProp(false)
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
      <div className="spacer"></div>
    </div>
  );
}

ProposalForm.propTypes = {
  show: showPropType.isRequired,
  edit: PropTypes.bool,
  setSubmitProp: PropTypes.func,
};

function ArtistProfile({ setUser }) {
  const profileFormId = useId();
  const profileIdFor = (fieldName) => `${profileFormId}-${fieldName}`;
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
      where("artists", "array-contains", auth.currentUser.uid),
      where("status", "in", ["proposed", "archived"])
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

      setUser(null);
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

      alert("profile successfully updated");
    } catch (err) {
      console.error(err.message);
      alert("something went wrong...");
    }
  };

  const imgUploader = async (img) => {
    try {
      const imgUrl = await uploadUserImage({
        storage,
        uid: auth.currentUser?.uid,
        file: img,
      });

      setPicUrl(imgUrl);
      alert("Image uploaded to Database");
    } catch (err) {
      console.error(err.message);
      alert(err.message);
    }
  };

  return (
    <div>
      <button onClick={logOut}>Log Out</button>
      <h1>Welcome {artist} to your Phantom Theater Artist portal</h1>
      {picUrl && <img src={picUrl} className="profile-pic" />}
      <h3>
        Here you can manage your artist profile, and submit show proposals!
      </h3>
      <h4 className="directions">
        Fields with a * are displayed on your profile in the &quot;Artists&quot;
        section
      </h4>
      <p className="directions">
        If you are copy/pasting info please delete and retype the last character
        so our system recognizes the input.
      </p>
      <div id="proposal-container">
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
            show={nullShow}
            setSubmitProp={setSubmitProp}
          />
        )}
        {/* Show/edit artist info */}
        <div className="artist-container">
          <h2 className="directions">Edit Artist Bio</h2>
          <form className="artist-profile-form" data-testid="artist-profile-form">
            <label htmlFor={profileIdFor("splash-img")}>Upload Your Profile Picture *</label>
            <input
              id={profileIdFor("splash-img")}
              className="image-field"
              type="file"
              accept="image/*"
              name="splash-img"
              data-testid="artist-profile-upload"
              onChange={(evt) => {
                const img = evt.target.files[0];
                setArtistPic(img);
              }}
            />
            <button
              data-testid="artist-profile-upload-button"
              className={`img-uploader highlight ${
                artistPic && !picUrl ? "flashing" : ""
              }`}
              disabled={!artistPic}
              onClick={(evt) => {
                evt.preventDefault();
                imgUploader(artistPic);
              }}
            >
              Upload your image to the Database (please do this <b>before</b>{" "}
              submitting the form)
            </button>
            <label htmlFor={profileIdFor("artist")}>Displayed name *</label>
            <input
              id={profileIdFor("artist")}
              name="artist"
              type="text"
              value={artist}
              onChange={(evt) => {
                setArtist(evt.target.value);
              }}
            />
            <label htmlFor={profileIdFor("phone")}>
              What is a good phone number to reach you at (for internal use only)?
            </label>
            <input
              id={profileIdFor("phone")}
              name="phone"
              type="text"
              value={phone}
              onChange={(evt) => {
                setPhone(evt.target.value);
              }}
            />
            <label htmlFor={profileIdFor("email")}>What&apos;s your primary email? *</label>
            <input
              id={profileIdFor("email")}
              name="email"
              type="email"
              value={email}
              onChange={(evt) => {
                setEmail(evt.target.value);
              }}
            />
            <label htmlFor={profileIdFor("bio")}>Tell us a little about yourself *</label>
            <input
              id={profileIdFor("bio")}
              name="bio"
              type="text"
              value={bio}
              onChange={(evt) => {
                setBio(evt.target.value);
              }}
            />
            <label htmlFor={profileIdFor("website")}>
              Enter the URL for your personal website (if you have one) *
            </label>
            <input
              id={profileIdFor("website")}
              name="website"
              type="text"
              value={artistWebsite}
              onChange={(evt) => {
                setArtistWebsite(evt.target.value);
              }}
            />
            <label htmlFor={profileIdFor("fb")}>Share your facebook if you want *</label>
            <input
              id={profileIdFor("fb")}
              name="fb"
              type="text"
              value={artistFacebook}
              onChange={(evt) => {
                setArtistFacebook(evt.target.value);
              }}
            />
            <label htmlFor={profileIdFor("insta")}>
              Got an instagram? We&apos;d love to link it on your profile! *
            </label>
            <input
              id={profileIdFor("insta")}
              name="insta"
              type="text"
              value={artistInstagram}
              onChange={(evt) => {
                setArtistInstagram(evt.target.value);
              }}
            />
            <label htmlFor={profileIdFor("spotify")}>
              Share your favorite tunes, link to your Spotify *
            </label>
            <input
              id={profileIdFor("spotify")}
              name="spotify"
              type="text"
              value={artistSpotify}
              onChange={(evt) => {
                setArtistSpotify(evt.target.value);
              }}
            />
            <label htmlFor={profileIdFor("youtube")}>
              Got a youtube channel? We can link that in too... *
            </label>
            <input
              id={profileIdFor("youtube")}
              name="youtube"
              type="text"
              value={artistYouTube}
              onChange={(evt) => {
                setArtistYouTube(evt.target.value);
              }}
            />

            <button onClick={updateProfile}>Update your information</button>
          </form>
        </div>
      </div>
      {/* List all active/archived shows for artist */}
      <div className="spacer"></div>
      <h1>Submitted Shows</h1>
      <div className="spacer"></div>
      {shows.map((show, i) => {
        return (
          <div key={i} className="show-container" data-testid={`artist-show-${show.id}`}>
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

ArtistProfile.propTypes = {
  setUser: PropTypes.func.isRequired,
};

function ArtistPortal() {
  const [user, setUser] = useState(auth.currentUser || null);

  return (
    <div>
      {!user ? (
        <LoginPortal setUser={setUser} />
      ) : (
        <ArtistProfile setUser={setUser} />
      )}
    </div>
  );
}

export default ArtistPortal;
