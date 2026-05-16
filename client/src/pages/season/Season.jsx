import { useState, useEffect } from "react";
import PropTypes from "prop-types";
import "./season.css";
import { db } from "../../config/firebase";
import { collection, query, where, getDocs } from "firebase/firestore";
import { safeTicketUrl } from "../../utils/safeUrl";

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

const showDatePropType = PropTypes.shape({
  date: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
  ticketLink: PropTypes.string,
  soldOut: PropTypes.bool,
});

const artistPropType = PropTypes.shape({
  id: PropTypes.string.isRequired,
  artist: PropTypes.string,
  name: PropTypes.string,
});

function collectAllIdsAndDocs(doc) {
  return { id: doc.id, ...doc.data() };
}

function SeasonEvent({
  id,
  title,
  dates,
  artists,
  blurb,
  imageLg,
  image2,
  image3,
  allArtists,
  contact,
}) {
  const [currentTime] = useState(() => Date.now());
  const showArtists = allArtists.filter((artist) => artists.includes(artist.id));

  return (
    <div className="season_container" id={id}>
      <h3> {title} </h3>
      <br />
      <div className="show-img-container">
        <img src={imageLg} alt="show-image" />
        {image2 && <img src={image2} alt="show-image" />}
        {image3 && <img src={image3} alt="show-image" />}
      </div>
      <br />
      <p>{contact}</p>
      {showArtists.map((artist, i) => {
        return <h4 key={i}>{artist.artist || artist.name}</h4>;
      })}
      <br />
      <p className="blurb">{blurb}</p>
      <br />
      {dates.map((date, i) => {
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
              {new Date(date.date).getTime() > currentTime && (
                <a
                  href={safeTicketUrl(date.ticketLink)}
                  target="_blank"
                  className="buy-ticket"
                  rel="noreferrer noopener"
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

SeasonEvent.propTypes = {
  id: PropTypes.string.isRequired,
  title: PropTypes.string.isRequired,
  dates: PropTypes.arrayOf(showDatePropType).isRequired,
  artists: PropTypes.arrayOf(PropTypes.string).isRequired,
  blurb: PropTypes.string,
  imageLg: PropTypes.string,
  image2: PropTypes.string,
  image3: PropTypes.string,
  allArtists: PropTypes.arrayOf(artistPropType).isRequired,
  contact: PropTypes.string,
};

function Season() {
  let [allShows, setAllShows] = useState([]);
  let [allArtists, setAllArtists] = useState([]);

  useEffect(() => {
    const showsRef = query(
      collection(db, "shows"),
      where("status", "==", "booked")
    );

    getDocs(showsRef)
      .then((showSnapshot) => {
        const allShowsArray = showSnapshot.docs.map(collectAllIdsAndDocs);
        allShowsArray.sort((a, b) =>
          new Date(a.dates[0].date) > new Date(b.dates[0].date) ? 1 : -1
        );
        setAllShows(allShowsArray);
        if (location.hash) {
          setTimeout(() => {
            const target = document.getElementById(location.hash.slice(1));
            target?.scrollIntoView();
          }, 1500);
        }
      })
      .catch((err) => {
        console.error(err.message);
      });
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
      <h1>Season 2025</h1>
      {allShows.map((show) => {
            return (
              <SeasonEvent
                key={show.id}
                id={show.id}
                title={show.title}
                dates={show.dates}
                artists={show.artists}
                blurb={show.blurb}
                imageLg={show.imageLg}
                image2={show.image2}
                image3={show.image3}
                allArtists={allArtists}
                contact={show.contactName}
              ></SeasonEvent>
            );
          })}
    </div>
  );
}

export default Season;
