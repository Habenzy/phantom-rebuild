import { useState, useEffect } from "react";
import { db, auth, storage } from "../../config/firebase";
import { signInWithEmailAndPassword } from "firebase/auth";
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
  deleteDoc,
} from "firebase/firestore";
import { getDownloadURL, ref, uploadBytes } from "firebase/storage";
import "./admin_portal.css";

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

function DateField(props) {
  const [dateTime, setDateTime] = useState(props.date.date || "");
  const [ticketLink, setTicketLink] = useState(props.date.ticketLink || "");
  const [soldOut, setSoldOut] = useState(false);

  return (
    <div className="date-time-field">
      <label htmlFor="date-time">Choose a showtime</label>
      <input
        type="datetime-local"
        name="date-time"
        value={dateTime}
        onChange={(evt) => {
          setDateTime(evt.target.value);
        }}
      />
      <label htmlFor="ticket-link">Link to tickets for this show time</label>
      <input
        name="ticket-link"
        type="text"
        value={ticketLink}
        placeholder="Ticket Link"
        onChange={(evt) => {
          setTicketLink(evt.target.value);
        }}
      />
      <label htmlFor="sold-out">Show is Sold out</label>
      <input
        name="sold-out"
        type="checkbox"
        value={soldOut}
        onChange={() => {
          setSoldOut(true);
        }}
      />
      <button
        className="submit highlight"
        onClick={(evt) => {
          evt.preventDefault();
          const upDate = props.allDates.toSpliced(props.index, 1, {
            date: dateTime,
            ticketLink: ticketLink,
            soldOut: soldOut,
          });
          props.update(upDate);
        }}
      >
        Confirm Show Time
      </button>
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
  const [artists, setArtist] = useState(props.show.artists || []);
  const [dates, setDates] = useState(props.show.dates || []);
  const [blurb, setBlurb] = useState(props.show.blurb || "");

  //images
  const [imageLg, setImageLg] = useState(props.show.imageLg || "");
  const [image2, setImage2] = useState(props.show.image2 || "");
  const [image3, setImage3] = useState(props.show.image3 || "");

  const [imgLgUrl, setImgLgUrl] = useState(props.show.imageLg || "");
  const [img2Url, setImg2Url] = useState(props.show.image2 || "");
  const [img3Url, setImg3Url] = useState(props.show.image3 || "");

  const imgUploader = async (img, targetProp) => {
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
    <div className="show-form-container">
      <h2>{title}</h2>
      <form className="show-proposal-form">
        {/* still need fields for "dates" */}
        <select value={status} onChange={(evt) => setStatus(evt.target.value)}>
          <option value="proposed">Proposed</option>
          <option value="booked">Booked</option>
          <option value="archived">Archived</option>
        </select>
        <div>
          {/* add dates, and set dates in date array when entered */}
          <button
            onClick={(evt) => {
              evt.preventDefault();
              addShowTime();
            }}
          >
            Add a new Show Time
          </button>
          <h3>Show Times</h3>
          <h4>
            Please hit the "Confirm Show Time" button after choosing a new
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
        <label htmlFor="blurb">
          The Show description that will appear on our site
        </label>
        <input
          type="text"
          name="blurb"
          value={blurb}
          onChange={(evt) => setBlurb(evt.target.value)}
        />
        <label htmlFor="title">Enter the name of show</label>
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
        <p className="internal-description">{description}</p>
        <label htmlFor="splash-img">
          Add a cover image to be displayed on our homepage
        </label>
        {props.show.imageLg && <img src={props.show.imageLg} />}
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
          Upload image to the Database (please do this <b>before</b> submitting
          the form)
        </button>
        <label htmlFor="img-2">Add additional images for show (optional)</label>
        {props.show.image2 && <img src={props.show.image2} />}
        <input
          type="file"
          name="img-2"
          className="image-field"
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
          Upload image to the Database (please do this <b>before</b> submitting
          the show details)
        </button>
        <label htmlFor="img-3">Add additional images for show (optional)</label>
        {props.show.image3 && <img src={props.show.image3} />}
        <input
          type="file"
          name="img-3"
          className="image-field"
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
          Upload image to the Database (please do this <b>before</b> submitting
          the show details)
        </button>
        <button
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
            setDoc(doc(db, "shows", props.show.id), showObj)
              .then((res) => {
                console.log(res);
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

function ArtistProfile(props) {
  const [artist, setArtist] = useState(props.user.artist || "");
  const [phone, setPhone] = useState(props.user.phone || "");
  const [email, setEmail] = useState(props.user.email || "");
  const [bio, setBio] = useState(props.user.bio || "");
  const [artistWebsite, setArtistWebsite] = useState(props.user.web || "");
  const [artistFacebook, setArtistFacebook] = useState(props.user.fb || "");
  const [artistYouTube, setArtistYouTube] = useState(props.user.youtube || "");
  const [artistInstagram, setArtistInstagram] = useState(
    props.user.insta || ""
  );
  const [artistSpotify, setArtistSpotify] = useState(props.user.spotify || "");
  const [artistPic, setArtistPic] = useState("");
  const [picUrl, setPicUrl] = useState(props.user.picUrl || "");

  let updateProfile = async (evt) => {
    evt.preventDefault();

    try {
      let profRef = doc(db, "artists", props.user.id);

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
    <div className="artist-container">
      <h2>{artist}</h2>
      <form className="artist-profile-form">
        <label htmlFor="splash-img">Upload Artist's Profile Picture</label>
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
        <label htmlFor="artist">Artist's Name</label>
        <input
          name="artist"
          type="text"
          value={artist}
          onChange={(evt) => {
            setArtist(evt.target.value);
          }}
        />
        <label htmlFor="phone">Primary Phone #</label>
        <input
          name="phone"
          type="text"
          value={phone}
          onChange={(evt) => {
            setPhone(evt.target.value);
          }}
        />
        <label htmlFor="email">Primary Email</label>
        <input
          name="email"
          type="email"
          value={email}
          onChange={(evt) => {
            setEmail(evt.target.value);
          }}
        />
        <label htmlFor="bio">Artist Bio</label>
        <input
          name="bio"
          type="text"
          value={bio}
          onChange={(evt) => {
            setBio(evt.target.value);
          }}
        />
        <label htmlFor="website">Artist Website</label>
        <input
          name="website"
          type="text"
          value={artistWebsite}
          onChange={(evt) => {
            setArtistWebsite(evt.target.value);
          }}
        />
        <label htmlFor="fb">Artist Facebook</label>
        <input
          name="fb"
          type="text"
          value={artistFacebook}
          onChange={(evt) => {
            setArtistFacebook(evt.target.value);
          }}
        />
        <label htmlFor="insta">Artist Instagram</label>
        <input
          name="insta"
          type="text"
          value={artistInstagram}
          onChange={(evt) => {
            setArtistInstagram(evt.target.value);
          }}
        />
        <label htmlFor="spotify">Artist Spotify</label>
        <input
          name="spotify"
          type="text"
          value={artistSpotify}
          onChange={(evt) => {
            setArtistSpotify(evt.target.value);
          }}
        />
        <label htmlFor="youtube">Artist Youtube</label>
        <input
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

function ProfileEditor(props) {
  return (
    <div>
      {props.users.map((user, i) => {
        return (
          <div key={i}>
            <ArtistProfile user={user} />
          </div>
        );
      })}
    </div>
  );
}

function ShowEditor(props) {
  const [showList, setShowList] = useState(props.shows);
  const [filter, setFilter] = useState("");

  useEffect(() => {
    filter === "all"
      ? setShowList(props.shows)
      : setShowList(props.shows.filter((show) => show.status === filter));
  }, [filter]);

  return (
    <div>
      <select
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

function AdminPanel(props) {
  const [authorized, setAuthorized] = useState(false);
  const [view, setView] = useState("shows");
  const [newDonor, setNewDonor] = useState("");
  const [allShows, setAllShows] = useState([]);
  const [artists, setArtists] = useState([]);
  const [donors, setDonors] = useState([]);

  useEffect(() => {
    fetch("/whitelist")
      .then((res) => res.json())
      .then((list) => {
        list.includes(auth.currentUser.uid)
          ? setAuthorized(true)
          : setAuthorized(false);
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
                  <li className="donor" key={i}>
                    <p>{donor.name}</p>
                    <button
                      onClick={(evt) => {
                        evt.preventDefault();
                        deleteDoc(doc(db, "donors", donor.id)).then((res) => {
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
                  .then((res) => {
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

function AdminPortal(props) {
  const [user, setUser] = useState(auth.currentUser || null);

  return (
    <div>
      <div>
        {!user ? (
          <LoginPortal setUser={setUser} />
        ) : (
          <AdminPanel user={user} setUser={setUser} />
        )}
      </div>
    </div>
  );
}

export default AdminPortal;
