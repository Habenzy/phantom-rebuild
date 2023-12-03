import { useState, useEffect } from "react";
import { db } from "../../config/firebase";
import { collection, query, getDocs } from "firebase/firestore";
import websiteIcon from "../../assets/internet.png";
import facebookIcon from "../../assets/facebookb.png";
import youtubeIcon from "../../assets/youtube.png";
import instagramIcon from "../../assets/instagramColor.png";
import spotifyIcon from "../../assets/spotify.png";
import "./artists.css"

function ArtistsList(props) {
  const [allArtists, setAllArtists] = useState([]);

  useEffect(() => {
    const artistsRef = query(collection(db, "artists"));
    getDocs(artistsRef).then((allArtists) => {
      console.log(allArtists.docs[0].data());
      let allArtistsArr = allArtists.docs.map((artist) => artist.data());
      setAllArtists(allArtistsArr);
    });
  }, []);
  return (
    <div className="artistsContainer">
      <h1>Artists</h1>
      {allArtists
        ? allArtists.map((artist, i) => {
            return (
              <div key={i} className="artistsContainer">
                <h3>{artist.name}</h3>

                <div className="artistImageContainer">
                  {artist.image1 ? <img src={artist.image1} alt="" /> : ""}
                  {artist.image2 ? <img src={artist.image2} alt="" /> : ""}
                  {artist.image3 ? <img src={artist.image3} alt="" /> : ""}
                </div>

                <div className="textContainer">
                  <div id="bioFormat">{artist.bio}</div>
                  <h5> {artist.email}</h5>
                  <div className="artistContact">
                    {artist.website ? (
                      <a href={artist.website} target="blank">
                        <img
                          src={websiteIcon}
                          alt=""
                          style={{ width: "50px" }}
                        ></img>
                      </a>
                    ) : (
                      ""
                    )}
                    {artist.facebook ? (
                      <a href={artist.facebook} target="blank">
                        <img
                          src={facebookIcon}
                          alt=""
                          style={{ width: "50px" }}
                        ></img>
                      </a>
                    ) : (
                      ""
                    )}
                    {artist.youtube ? (
                      <a href={artist.youtube} target="blank">
                        <img
                          src={youtubeIcon}
                          alt=""
                          style={{ width: "50px" }}
                        ></img>
                      </a>
                    ) : (
                      ""
                    )}
                    {artist.instagram ? (
                      <a href={artist.instagram} target="blank">
                        <img
                          src={instagramIcon}
                          alt=""
                          style={{ width: "50px" }}
                        ></img>
                      </a>
                    ) : (
                      ""
                    )}
                    {artist.spotify ? (
                      <a href={artist.spotify} target="blank">
                        <img
                          src={spotifyIcon}
                          alt=""
                          style={{ width: "50px" }}
                        ></img>
                      </a>
                    ) : (
                      ""
                    )}
                  </div>
                </div>
                <div className="line"></div>
              </div>
            );
          })
        : "loading"}
    </div>
  );
}

export default ArtistsList;
