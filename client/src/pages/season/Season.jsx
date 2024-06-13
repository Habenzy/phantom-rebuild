import { useState, useEffect } from "react";
import "./season.css";
import { db } from "../../config/firebase";
import { collection, query, where, getDocs } from "firebase/firestore";

const daysOfWeek = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
];
const months = [
  "Jan",
  "Feb",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "Sept",
  "October",
  "Nov",
  "Dec",
];

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
    <div className="season_container" id={props.id}>
      <h3> {props.title} </h3>
      <br />
      <img src={props.imageLg} alt="show-image" />
      {props.image2 && <img src={props.image2} alt="show-image" />}
      {props.image3 && <img src={props.image3} alt="show-image" />}
      <br />
      <p>{props.contact}</p>
      {showArtists.map((artist, i) => {
        return <p key={i}>{artist.name}</p>;
      })}
      <p className="blurb">{props.blurb}</p>
      <br />
      {props.dates.map((date, i) => {
        return (
          <div className="ticket-card" key={i}>
            <p>
              {`${daysOfWeek[new Date(date.date).getDay()]} ${
                months[new Date(date.date).getMonth()]
              } ${new Date(date.date).getDate()}, ${
                new Date(date.date).getHours() > 12
                  ? new Date(date.date).getHours() - 12
                  : new Date(date.date).getHours()
              }:0${new Date(date.date).getMinutes()}`}
            </p>
            <br></br>
            {new Date(date.date) > Date.now() && (
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
            )}
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
        allShowsArray.sort((a, b) =>
          new Date(a.dates[0].date) > new Date(b.dates[0].date) ? 1 : -1
        );
        setAllShows(allShowsArray);
        if(location.hash) {
          window.scrollTo(location.hash)
        }
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
      <h1>Season 2024</h1>
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
                image2={show.image2}
                image3={show.image3}
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
