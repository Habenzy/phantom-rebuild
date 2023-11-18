import { useState, useEffect } from "react";

import barnImg from "../../assets/barn3crop.jpg"
import "./home.css"

function Home(props) {
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
          <img id="homeImage" src={barnImg} alt="Now Showing" />
        </div>
        <div className="currentPlayText">
          <h2>Shows Coming Soon!</h2>
          {/* FUTURE UPDATE: change this to a .map function */}
          {/* {allShows.length >= 1 && splashShowNum === 0 ? (
            <div>Showtimes coming soon.</div>
          ) : (
            console.log("showtimes coming soon...")
          )}
          {splashShowNum >= 1 ? changeDate(splashDates[0]) : console.log()}
          {splashShowNum >= 2 ? <br /> : console.log()}
          {splashShowNum >= 2 ? changeDate(splashDates[1]) : console.log()}
          {splashShowNum >= 3 ? <br /> : console.log()}
          {splashShowNum >= 3 ? changeDate(splashDates[2]) : console.log()}
          {splashShowNum >= 4 ? <br /> : console.log()}
          {splashShowNum >= 4 ? changeDate(splashDates[3]) : console.log()}
          {splashShowNum >= 5 ? <br /> : console.log()}
          {splashShowNum >= 5 ? changeDate(splashDates[4]) : console.log()}
          {splashShowNum >= 6 ? <br /> : console.log()}
          {splashShowNum >= 6 ? changeDate(splashDates[5]) : console.log()}
          <br />
          {/* Artist Info button */}
          {/* {splashId ? (
            <div>
              <button onClick={showSplashArtist}>- Artist Info -</button>
              <a 
                href='https://sevendaystickets.com/organizations/phantom-theater'
                target="_blank"
              >
                Buy Tickets
              </a>
            </div>
          ) : (
            console.log()
          )} } */}
        </div>
      </div>

      {/* fires only if there is a next show */}
      {/* {nextId ? (
        // Next show container
        <div className="whatNext">
          <div className="whatNextImg">
            <img id="nextImage" src={nextImage} alt={"show pic"} />
          </div>
          <div className="whatNextText">
            <h2>{`${nextTitle}`}</h2>
           
            {nextShowNum === 0 ? (
              <div>See you next season!</div>
            ) : (
              console.log()
            )}
            {nextShowNum >= 1 ? changeDate(nextDates[0]) : console.log()}
            {nextShowNum >= 2 ? <br /> : console.log()}
            {nextShowNum >= 2 ? changeDate(nextDates[1]) : console.log()}
            {nextShowNum >= 3 ? <br /> : console.log()}
            {nextShowNum >= 3 ? changeDate(nextDates[2]) : console.log()}
            {nextShowNum >= 4 ? <br /> : console.log()}
            {nextShowNum >= 4 ? changeDate(nextDates[3]) : console.log()}
            {nextShowNum >= 5 ? <br /> : console.log()}
            {nextShowNum >= 5 ? changeDate(nextDates[4]) : console.log()}
            {nextShowNum >= 6 ? <br /> : console.log()}
            {nextShowNum >= 6 ? changeDate(nextDates[5]) : console.log()}
            <br />
           
            <button onClick={showNextArtist}>- Artist Info -</button>
            <a
              href='https://sevendaystickets.com/organizations/phantom-theater'

              target="_blank"
            >
              Buy Tickets
            </a>
          </div>
        </div>
      ) : (
        ""
      )} */}
    </div>
  );
}

export default Home