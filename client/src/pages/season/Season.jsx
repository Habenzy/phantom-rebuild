import { useState, useEffect } from "react";
import "./season.css";
import { db } from "../../config/firebase";
import { collection, query, where, getDocs } from "firebase/firestore";

function SeasonEvent(props) {
  const [showArtists, setShowArtists] = useState([]);

  useEffect(() => {
    console.log(`in show ${props.title}`);
    console.log("show artists", props.artists);
    console.log("all artists", props.allArtists);
    let involved = props.allArtists.filter((artist) => {
      return props.artists.includes(artist.id);
    });

    console.log(involved);

    setShowArtists(involved);
  }, []);

  return (
    <div className="season_container">
      <h3> {props.title} </h3>
      <br />
      <img src={props.imageLg} alt="show-image" />
      <br />
      <p>{props.contact}</p>
      {showArtists.map((artist, i) => {
        return <p key={i}>{artist.name}</p>;
      })}
      <p className="blurb">{props.blurb}</p>
      <br />
      {props.dates.map((showtime, i) => {
        return (
          <div className="ticket-card" key={i}>
            <p>{showtime.date.toLocaleString("en-US", { timeZone: "EST" })}</p>
            <br></br>

            <a
              href={
                props.ticketUrl
                  ? props.ticketUrl
                  : `https://sevendaystickets.com/organizations/phantom-theater`
              }
              target="_blank"
              className="buy-ticket"
              rel="noreferrer"
            >
              Buy Tickets
            </a>
          </div>
        );
      })}

      <div className="line"></div>
    </div>
  );
}

function Season(props) {
  function collectAllIdsAndDocs(doc) {
    return { id: doc.id, ...doc.data() };
  }

  let [allShows, setAllShows] = useState([]);
  let [allArtists, setAllArtists] = useState([]);

  async function seeAllShows() {
    const showsRef = query(
      collection(db, "shows"),
      where("status", "==", "booked")
    );
    try {
      const showSnapshot = await getDocs(showsRef);

      const allShowsArray = showSnapshot.docs.map(collectAllIdsAndDocs);

      if (!allShows.length) {
        allShowsArray.sort((a, b) => (a.dates[0] > b.dates[0] ? 1 : -1));
        setAllShows(allShowsArray);
      }
    } catch (err) {
      console.error(err.message);
    }
  }

  useEffect(() => {
    seeAllShows();
  }, []);

  useEffect(() => {
    getDocs(collection(db, "artists"))
      .then((res) => {
        let artRes = res.docs.map((art) => {
          let arty = art.data();
          arty.id = art.id;

          return arty;
        });
        //console.log(artRes);
        setAllArtists(artRes);
      })
      .catch((err) => {
        console.error(err.message);
      });
  }, []);

  return (
    <div className="season_container">
      <h1>Season 2023</h1>
      {allShows
        ? allShows.map((show) => {
            return (
              <SeasonEvent
                key={show.id}
                id={show.id}
                title={show.title}
                dates={show.dates}
                type={show.type}
                artists={show.artists}
                blurb={show.blurb}
                imageLg={show.imageLg}
                allArtists={allArtists}
                contact={show.contactName}
              ></SeasonEvent>
            );
          })
        : "loading"}
    </div>
  );
}

export default Season;
