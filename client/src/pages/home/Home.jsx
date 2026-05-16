import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { db } from "../../config/firebase";
import { collection, query, where, getDocs } from "firebase/firestore";
import barnImg from "../../assets/barn3crop.jpg";
import { safeTicketUrl } from "../../utils/safeUrl";
import "./home.css";

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

function collectAllIdsAndDocs(doc) {
  return { id: doc.id, ...doc.data() };
}

function Home() {
  const [shows, setShows] = useState([]);
  const [featureImg, setFeatureImg] = useState(barnImg);

  useEffect(() => {
    const showsRef = query(
      collection(db, "shows"),
      where("status", "==", "booked")
    );

    getDocs(showsRef)
      .then((showSnapshot) => {
        const allShowsArray = showSnapshot.docs.map(collectAllIdsAndDocs);
        let upcoming = allShowsArray.filter((show) => {
          if (!show.dates?.length) {
            return false;
          }

          let lastShow = new Date(show.dates[show.dates.length - 1].date);
          return lastShow > Date.now();
        });

        upcoming.sort((prev, next) => {
          return (
            new Date(prev.dates[prev.dates.length - 1].date) -
            new Date(next.dates[next.dates.length - 1].date)
          );
        });

        setShows(upcoming);
        if (upcoming.length) {
          setFeatureImg(upcoming[0].imageLg);
        }
      })
      .catch((err) => {
        console.error(err.message);
      });
  }, []);

  return (
    // This is the entire page container
    <div className="homeContainer">
      {/* Firefly Divs that draws to the page */}
      <div className="firefly"></div>
      <div className="firefly"></div>
      <div className="firefly"></div>
      <div className="firefly"></div>
      <div className="firefly"></div>
      <div className="firefly"></div>
      <div className="firefly"></div>
      <div className="firefly"></div>
      <div className="firefly"></div>
      <div className="firefly"></div>
      <div className="firefly"></div>
      <div className="firefly"></div>
      <div className="firefly"></div>
      <div className="firefly"></div>
      <div className="firefly"></div>

      {/* Main show container */}
      <div className="currentPlay">
        <div id="nowPlaying">
          <img id="homeImage" src={featureImg} alt="Now Showing" />
        </div>
        <div className="currentPlayText">
          <h2>{shows.length ? shows[0].title : "Show Times Coming Soon!"}</h2>
          {shows.length && <Link to={`/Season#${shows[0].id}`}>More Info</Link>}
          {shows.length
            ? shows[0].dates.map((date, i) => {
                //console.log(new Date(date.date));
                return (
                  <div className="ticket-time" key={i}>
                    <p>{`${daysOfWeek[new Date(date.date).getDay()]} ${
                      months[new Date(date.date).getMonth()]
                    } ${new Date(date.date).getDate()}, ${
                      new Date(date.date).getHours() > 12
                        ? new Date(date.date).getHours() - 12
                        : new Date(date.date).getHours()
                    }:${
                      new Date(date.date).getMinutes() > 9
                        ? new Date(date.date).getMinutes()
                        : "0" + new Date(date.date).getMinutes()
                    } ${new Date(date.date).getHours() > 12 ? "pm" : "am"}`}</p>
                    <a
                      href={safeTicketUrl(date.ticketLink)}
                      target="_blank"
                      rel="noreferrer noopener"
                      className="buy-tickets"
                    >
                      Buy Tickets
                    </a>
                  </div>
                );
              })
            : ""}
        </div>
      </div>

      {/* fires only if there is a next show */}
      {shows[1] ? (
        // Next show container
        <div className="whatNext">
          <div className="whatNextImg">
            <img id="nextImage" src={shows[1].imageLg} alt={"show pic"} />
          </div>
          <div className="whatNextText">
            <h2>{shows[1].title}</h2>
            <Link to={`/Season#${shows[1].id}`}>More Info</Link>
            {shows[1].dates.map((date, i) => {
              return (
                <div className="ticket-time" key={i}>
                  <p>
                    {new Date(date.date).toLocaleString("en-US", {
                      timeZone: "America/New_York",
                    })}
                  </p>
                  <a
                    href={safeTicketUrl(date.ticketLink)}
                    target="_blank"
                    rel="noreferrer noopener"
                  >
                    Buy Tickets
                  </a>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        ""
      )}
    </div>
  );
}

export default Home;
