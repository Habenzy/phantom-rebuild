import { useState, useEffect, useId } from "react";
import PropTypes from "prop-types";
import { db, auth, storage } from "../../config/firebase";
import { signInWithEmailAndPassword } from "firebase/auth";
import {
  collection,
  doc,
  query,
  setDoc,
  getDoc,
  updateDoc,
  getDocs,
  deleteDoc,
} from "firebase/firestore";
import { getDownloadURL, ref, uploadBytes } from "firebase/storage";
import "./admin_portal.css";

function imageRefForUser(img) {
  const safeName = img.name.replace(/[^a-zA-Z0-9._-]/g, "_");
  const uniqueId = globalThis.crypto?.randomUUID?.() || Date.now();
  return ref(storage, `uploads/${auth.currentUser.uid}/${uniqueId}-${safeName}`);
}

const showDatePropType = PropTypes.shape({
  date: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  ticketLink: PropTypes.string,
  soldOut: PropTypes.bool,
});

const showPropType = PropTypes.shape({
  id: PropTypes.string,
  title: PropTypes.string,
  type: PropTypes.string,
  status: PropTypes.string,
  description: PropTypes.string,
  contactName: PropTypes.string,
  artists: PropTypes.arrayOf(PropTypes.string),
  dates: PropTypes.arrayOf(showDatePropType),
  blurb: PropTypes.string,
  imageLg: PropTypes.string,
  image2: PropTypes.string,
  image3: PropTypes.string,
});

const artistProfilePropType = PropTypes.shape({
  id: PropTypes.string,
  artist: PropTypes.string,
  phone: PropTypes.string,
  email: PropTypes.string,
  bio: PropTypes.string,
  web: PropTypes.string,
  fb: PropTypes.string,
  youtube: PropTypes.string,
  insta: PropTypes.string,
  spotify: PropTypes.string,
  picUrl: PropTypes.string,
});

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

  return (
    <div>
      <form className="login-form">
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
        </div>
      </form>
      {err && <div className="err-banner">{err}</div>}
    </div>
  );
}

LoginPortal.propTypes = {
  setUser: PropTypes.func.isRequired,
};

function DateField({ date, allDates, index, update }) {
  const fieldId = useId();
  const idFor = (fieldName) => `${fieldId}-${fieldName}`;
  const [dateTime, setDateTime] = useState(date.date || "");
  const [ticketLink, setTicketLink] = useState(date.ticketLink || "");
  const [soldOut, setSoldOut] = useState(date.soldOut || false);

  return (
    <div className="date-time-field">
      <label htmlFor={idFor("date-time")}>Choose a showtime</label>
      <input
        id={idFor("date-time")}
        type="datetime-local"
        name="date-time"
        data-testid="admin-show-date"
        value={dateTime}
        onChange={(evt) => {
          setDateTime(evt.target.value);
        }}
      />
      <label htmlFor={idFor("ticket-link")}>Link to tickets for this show time</label>
      <input
        id={idFor("ticket-link")}
        name="ticket-link"
        type="text"
        data-testid="admin-ticket-link"
        value={ticketLink}
        placeholder="Ticket Link"
        onChange={(evt) => {
          setTicketLink(evt.target.value);
        }}
      />
      <label htmlFor={idFor("sold-out")}>Show is Sold out</label>
      <input
        id={idFor("sold-out")}
        name="sold-out"
        type="checkbox"
        data-testid="admin-sold-out"
        value={soldOut}
        onChange={() => {
          setSoldOut(true);
        }}
      />
      <button
        data-testid="admin-confirm-show-time"
        className="submit highlight"
        onClick={(evt) => {
          evt.preventDefault();
          const upDate = allDates.toSpliced(index, 1, {
            date: dateTime,
            ticketLink: ticketLink,
            soldOut: soldOut,
          });
          update(upDate);
        }}
      >
        Confirm Show Time
      </button>
    </div>
  );
}

DateField.propTypes = {
  date: showDatePropType.isRequired,
  allDates: PropTypes.arrayOf(showDatePropType).isRequired,
  index: PropTypes.number.isRequired,
  update: PropTypes.func.isRequired,
};

function ProposalForm({ show }) {
  const formId = useId();
  const idFor = (fieldName) => `${formId}-${fieldName}`;
  // create state objects to hold values from input form
  const [title, setTitle] = useState(show.title || "");
  const [type, setType] = useState(show.type || "");
  const [status, setStatus] = useState(show.status || "proposed");
  const description = show.description || "";
  const [contact, setContact] = useState(show.contactName || "");
  const artists = show.artists || [];
  const [dates, setDates] = useState(show.dates || []);
  const [blurb, setBlurb] = useState(show.blurb || "");

  //images
  const [imageLg, setImageLg] = useState(show.imageLg || "");
  const [image2, setImage2] = useState(show.image2 || "");
  const [image3, setImage3] = useState(show.image3 || "");

  const [imgLgUrl, setImgLgUrl] = useState(show.imageLg || "");
  const [img2Url, setImg2Url] = useState(show.image2 || "");
  const [img3Url, setImg3Url] = useState(show.image3 || "");

  const imgUploader = async (img, targetProp) => {
    const imgRef = imageRefForUser(img);
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
      alert("Image uploaded to the Database");
    } catch (err) {
      console.error(err.message);
      alert("something went wrong");
    }
  };

  const addShowTime = () => {
    // generate new blank date object in array

    let updatedArr = dates.concat([
      {
        date: Date.now(),
        ticketLink: "",
        soldOut: false,
      },
    ]);

    setDates(updatedArr);
  };

  return (
    <div className="show-form-container" data-testid={`admin-show-card-${show.id}`}>
      <h2>{title}</h2>
      <form className="show-proposal-form">
        {/* still need fields for "dates" */}
        <select
          data-testid="admin-show-status"
          value={status}
          onChange={(evt) => setStatus(evt.target.value)}
        >
          <option value="proposed">Proposed</option>
          <option value="booked">Booked</option>
          <option value="archived">Archived</option>
        </select>
        <div>
          {/* add dates, and set dates in date array when entered */}
          <button
            data-testid="admin-add-show-time"
            onClick={(evt) => {
              evt.preventDefault();
              addShowTime();
            }}
          >
            Add a new Show Time
          </button>
          <h3>Show Times</h3>
          <h4>
            Please hit the &quot;Confirm Show Time&quot; button after choosing a new
            showtime
          </h4>
          {dates.map((date, i) => {
            return (
              <DateField
                key={i}
                index={i}
                date={date}
                allDates={dates}
                update={setDates}
              />
            );
          })}
        </div>
        <label htmlFor={idFor("blurb")}>
          The Show description that will appear on our site
        </label>
        <input
          id={idFor("blurb")}
          type="text"
          name="blurb"
          value={blurb}
          onChange={(evt) => setBlurb(evt.target.value)}
        />
        <label htmlFor={idFor("title")}>Enter the name of show</label>
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
        <p className="internal-description">{description}</p>
        <label htmlFor={idFor("splash-img")}>
          Add a cover image to be displayed on our homepage
        </label>
        {show.imageLg && <img src={show.imageLg} alt="" />}
        <input
          id={idFor("splash-img")}
          className="image-field"
          type="file"
          name="splash-img"
          data-testid="admin-cover-upload"
          onChange={(evt) => {
            const img = evt.target.files[0];
            setImageLg(img);
          }}
        />
        <button
          data-testid="admin-cover-upload-button"
          className={`img-uploader highlight ${
            imageLg && !imgLgUrl ? "flashing" : ""
          }`}
          onClick={(evt) => {
            evt.preventDefault();
            imgUploader(imageLg, "splash");
          }}
        >
          Upload image to the Database (please do this <b>before</b> submitting
          the form)
        </button>
        <label htmlFor={idFor("img-2")}>Add additional images for show (optional)</label>
        {show.image2 && <img src={show.image2} alt="" />}
        <input
          id={idFor("img-2")}
          type="file"
          name="img-2"
          className="image-field"
          data-testid="admin-second-upload"
          onChange={(evt) => {
            const img = evt.target.files[0];
            setImage2(img);
          }}
        />
        <button
          data-testid="admin-second-upload-button"
          className={`img-uploader highlight ${
            image2 && !img2Url ? "flashing" : ""
          }`}
          onClick={(evt) => {
            evt.preventDefault();
            imgUploader(image2, "2");
          }}
        >
          Upload image to the Database (please do this <b>before</b> submitting
          the show details)
        </button>
        <label htmlFor={idFor("img-3")}>Add additional images for show (optional)</label>
        {show.image3 && <img src={show.image3} alt="" />}
        <input
          id={idFor("img-3")}
          type="file"
          name="img-3"
          className="image-field"
          data-testid="admin-third-upload"
          onChange={(evt) => {
            const img = evt.target.files[0];
            setImage3(img);
          }}
        />
        <button
          data-testid="admin-third-upload-button"
          className={`img-uploader highlight ${
            image3 && !img3Url ? "flashing" : ""
          }`}
          onClick={(evt) => {
            evt.preventDefault();
            imgUploader(image3, "3");
          }}
        >
          Upload image to the Database (please do this <b>before</b> submitting
          the show details)
        </button>
        <button
          data-testid="admin-submit-show"
          className="submit-show"
          onClick={(evt) => {
            evt.preventDefault();
            const showObj = {
              title: title,
              type: type,
              blurb: blurb,
              status: status,
              dates: dates,
              artists: artists,
              contactName: contact,
              description: description,
              imageLg: imgLgUrl,
              image2: img2Url,
              image3: img3Url,
            };
            setDoc(doc(db, "shows", show.id), showObj)
              .then(() => {
                alert("Show updated successfully");
                //alert that update was successful
              })
              .catch((err) => {
                console.error(err.message);
                alert("Something went wrong...");
              });
          }}
        >
          Submit show details
        </button>
      </form>
      <div className="spacer"></div>
    </div>
  );
}

ProposalForm.propTypes = {
  show: showPropType.isRequired,
};

function ArtistProfile({ user }) {
  const profileFormId = useId();
  const profileIdFor = (fieldName) => `${profileFormId}-${fieldName}`;
  const [artist, setArtist] = useState(user.artist || "");
  const [phone, setPhone] = useState(user.phone || "");
  const [email, setEmail] = useState(user.email || "");
  const [bio, setBio] = useState(user.bio || "");
  const [artistWebsite, setArtistWebsite] = useState(user.web || "");
  const [artistFacebook, setArtistFacebook] = useState(user.fb || "");
  const [artistYouTube, setArtistYouTube] = useState(user.youtube || "");
  const [artistInstagram, setArtistInstagram] = useState(user.insta || "");
  const [artistSpotify, setArtistSpotify] = useState(user.spotify || "");
  const [artistPic, setArtistPic] = useState("");
  const [picUrl, setPicUrl] = useState(user.picUrl || "");

  let updateProfile = async (evt) => {
    evt.preventDefault();

    try {
      let profRef = doc(db, "artists", user.id);

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
      alert("Artist profile updated successfully");
    } catch (err) {
      console.error(err.message);
    }
  };

  const imgUploader = async (img) => {
    console.log("uploading image");
    console.log(img);
    const imgRef = imageRefForUser(img);
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
    <div className="artist-container" data-testid={`admin-artist-profile-${user.id}`}>
      <h2>{artist}</h2>
      {picUrl && <img src={picUrl} className="profile-pic" />}
      <form className="artist-profile-form">
        <label htmlFor={profileIdFor("splash-img")}>Upload Artist&apos;s Profile Picture</label>
        <input
          id={profileIdFor("splash-img")}
          className="image-field"
          type="file"
          name="splash-img"
          data-testid="admin-artist-upload"
          onChange={(evt) => {
            const img = evt.target.files[0];
            setArtistPic(img);
          }}
        />
        <button
          data-testid="admin-artist-upload-button"
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
        <label htmlFor={profileIdFor("artist")}>Artist&apos;s Name</label>
        <input
          id={profileIdFor("artist")}
          name="artist"
          type="text"
          value={artist}
          onChange={(evt) => {
            setArtist(evt.target.value);
          }}
        />
        <label htmlFor={profileIdFor("phone")}>Primary Phone #</label>
        <input
          id={profileIdFor("phone")}
          name="phone"
          type="text"
          value={phone}
          onChange={(evt) => {
            setPhone(evt.target.value);
          }}
        />
        <label htmlFor={profileIdFor("email")}>Primary Email</label>
        <input
          id={profileIdFor("email")}
          name="email"
          type="email"
          value={email}
          onChange={(evt) => {
            setEmail(evt.target.value);
          }}
        />
        <label htmlFor={profileIdFor("bio")}>Artist Bio</label>
        <input
          id={profileIdFor("bio")}
          name="bio"
          type="text"
          value={bio}
          onChange={(evt) => {
            setBio(evt.target.value);
          }}
        />
        <label htmlFor={profileIdFor("website")}>Artist Website</label>
        <input
          id={profileIdFor("website")}
          name="website"
          type="text"
          value={artistWebsite}
          onChange={(evt) => {
            setArtistWebsite(evt.target.value);
          }}
        />
        <label htmlFor={profileIdFor("fb")}>Artist Facebook</label>
        <input
          id={profileIdFor("fb")}
          name="fb"
          type="text"
          value={artistFacebook}
          onChange={(evt) => {
            setArtistFacebook(evt.target.value);
          }}
        />
        <label htmlFor={profileIdFor("insta")}>Artist Instagram</label>
        <input
          id={profileIdFor("insta")}
          name="insta"
          type="text"
          value={artistInstagram}
          onChange={(evt) => {
            setArtistInstagram(evt.target.value);
          }}
        />
        <label htmlFor={profileIdFor("spotify")}>Artist Spotify</label>
        <input
          id={profileIdFor("spotify")}
          name="spotify"
          type="text"
          value={artistSpotify}
          onChange={(evt) => {
            setArtistSpotify(evt.target.value);
          }}
        />
        <label htmlFor={profileIdFor("youtube")}>Artist Youtube</label>
        <input
          id={profileIdFor("youtube")}
          name="youtube"
          type="text"
          value={artistYouTube}
          onChange={(evt) => {
            setArtistYouTube(evt.target.value);
          }}
        />

        <button onClick={updateProfile}>Update artist information</button>
      </form>
      <div className="spacer"></div>
    </div>
  );
}

ArtistProfile.propTypes = {
  user: artistProfilePropType.isRequired,
};

function ProfileEditor({ users }) {
  return (
    <div>
      {users.map((user, i) => {
        return (
          <div key={i}>
            <ArtistProfile user={user} />
          </div>
        );
      })}
    </div>
  );
}

ProfileEditor.propTypes = {
  users: PropTypes.arrayOf(artistProfilePropType).isRequired,
};

function ShowEditor({ shows }) {
  const [filter, setFilter] = useState("");
  const showList =
    filter === "" || filter === "all"
      ? shows
      : shows.filter((show) => show.status === filter);

  return (
    <div>
      <select
        data-testid="admin-show-filter"
        value={filter}
        onChange={(evt) => {
          setFilter(evt.target.value);
        }}
      >
        <option value="">Which Shows Would you like to see?</option>
        <option value="all">Display all shows and proposals</option>
        <option value="proposed">Display show Proposals only</option>
        <option value="booked">Display Booked shows only</option>
        <option value="archived">Display Archived shows only</option>
      </select>
      {showList.map((show, i) => {
        return <ProposalForm key={i} show={show} />;
      })}
    </div>
  );
}

ShowEditor.propTypes = {
  shows: PropTypes.arrayOf(showPropType).isRequired,
};

function AdminPanel() {
  const [authorized, setAuthorized] = useState(false);
  const [view, setView] = useState("shows");
  const [newDonor, setNewDonor] = useState("");
  const [allShows, setAllShows] = useState([]);
  const [artists, setArtists] = useState([]);
  const [donors, setDonors] = useState([]);

  useEffect(() => {
    if (!auth.currentUser) {
      return;
    }

    getDoc(doc(db, "admins", auth.currentUser.uid))
      .then((adminDoc) => {
        setAuthorized(adminDoc.exists());
      })
      .catch((err) => {
        console.error(err.message);
        setAuthorized(false);
      });
  }, []);

  useEffect(() => {
    //fetch all show data
    let showsRef = query(collection(db, "shows"));
    getDocs(showsRef)
      .then((showsRes) => {
        const shows = showsRes.docs.map((showData) => {
          let showInfo = showData.data();
          showInfo.id = showData.id;
          return showInfo;
        });
        console.log(shows);
        setAllShows(shows);
      })
      .catch((err) => console.error(err.message));
  }, []);

  useEffect(() => {
    //fetch all user data
    let usersRef = query(collection(db, "artists"));
    getDocs(usersRef)
      .then((usersRes) => {
        const allUsers = usersRes.docs.map((userData) => {
          let userInfo = userData.data();
          userInfo.id = userData.id;
          return userInfo;
        });
        console.log(allUsers);
        setArtists(allUsers);
      })
      .catch((err) => console.error(err.message));
  }, []);

  useEffect(() => {
    //fetch all user data
    let donorsRef = query(collection(db, "donors"));
    getDocs(donorsRef)
      .then((donorsRes) => {
        const alldonors = donorsRes.docs.map((donorData) => {
          let donorInfo = donorData.data();
          donorInfo.id = donorData.id;
          return donorInfo;
        });
        console.log(alldonors);
        setDonors(alldonors);
      })
      .catch((err) => console.error(err.message));
  }, []);

  return (
    <div>
      {!authorized ? (
        <h1>403: Forbidden</h1>
      ) : (
        <div>
          <button
            onClick={() => {
              setView("shows");
            }}
          >
            Edit Shows
          </button>
          <button
            onClick={() => {
              setView("profiles");
            }}
          >
            Edit Artist Profiles
          </button>
          {view === "shows" ? (
            <ShowEditor shows={allShows} />
          ) : (
            <ProfileEditor users={artists} />
          )}
          <div className="sponsor-list">
            <ul>
              {donors.map((donor, i) => {
                console.log(donor);
                return (
                  <li className="donor" data-testid={`admin-donor-${donor.id}`} key={i}>
                    <p>{donor.name}</p>
                    <button
                      onClick={(evt) => {
                        evt.preventDefault();
                        deleteDoc(doc(db, "donors", donor.id)).then(() => {
                          alert(
                            `Donor ${donor.name} removed from database (refresh page to see changes to donor list)`
                          );
                        });
                      }}
                    >
                      Delete
                    </button>
                  </li>
                );
              })}
            </ul>
            <label htmlFor="add-donor">New Donor</label>
            <input
              id="add-donor"
              type="text"
              name="add-donor"
              value={newDonor}
              onChange={(evt) => {
                evt.preventDefault();
                setNewDonor(evt.target.value);
              }}
            />
            <button
              onClick={(evt) => {
                evt.preventDefault();
                let newDoc = doc(collection(db, "donors"));

                setDoc(newDoc, { name: newDonor, id: newDoc.id })
                  .then(() => {
                    setNewDonor("");
                    alert(
                      "New donor added, refresh the page to see the updated list"
                    );
                  })
                  .catch((err) => {
                    console.error(err.message);
                  });
              }}
            >
              Add Donor
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function AdminPortal() {
  const [user, setUser] = useState(auth.currentUser || null);

  return (
    <div>
      <div>
        {!user ? (
          <LoginPortal setUser={setUser} />
        ) : (
          <AdminPanel />
        )}
      </div>
    </div>
  );
}

export default AdminPortal;
