import { useState, useEffect } from "react";
import "./season.css";
import { db } from "../../config/firebase";
import { collection, query, where, getDocs } from "firebase/firestore";

function SeasonEvent(props) {

  return (
    <div className="season_container">
      <h3> {props.title} </h3>
      <br />
      <img src={props.imageLg} alt="show-image" />
      <br />
      <p className="artist">{props.artist}</p>
      <p className="blurb">{props.blurb}</p>
      <br />

      {props.dates.map((showtime, i) => {
        <div className="ticket-card">
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
        </div>;
      })}

      <div className="line"></div>
    </div>
  );
}

function Season(props) {
  function collectAllIdsAndDocs(doc) {
    return { id: doc.id, ...doc.data() };
  }

  let [allShows, setAllShows] = useState(null);

  async function seeAllShows() {
    const showsRef = query(
      collection(db, "shows"),
      where("status", "==", "booked")
    );
    try {
      const showSnapshot = await getDocs(showsRef);

      const allShowsArray = showSnapshot.docs.map(collectAllIdsAndDocs);
      if (!allShows) {
        setAllShows(allShowsArray);
      }
    } catch (err) {
      console.error(err.message);
    }
  }

  useEffect(() => {
    seeAllShows();
  }, []);

  if (allShows) {
    allShows.sort((a, b) => (a.dates[0] > b.dates[0] ? 1 : -1));
  }

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
                artist={show.artist}
                blurb={show.blurb}
                imageLg={show.imageLg}
              ></SeasonEvent>
            );
          })
        : "loading"}
    </div>
  );
}

export default Season;
