import { useState, useEffect } from "react";
import { db } from "../../config/firebase";
import { collection, query, getDocs } from "firebase/firestore";
import websiteIcon from "../../assets/internet.png";
import facebookIcon from "../../assets/facebookb.png";
import youtubeIcon from "../../assets/youtube.png";
import instagramIcon from "../../assets/instagramColor.png";
import spotifyIcon from "../../assets/spotify.png";
import "./artists.css";

function ArtistsList(props) {
  const [allArtists, setAllArtists] = useState([]);

  useEffect(() => {
    const artistsRef = query(collection(db, "artists"));
    getDocs(artistsRef).then((allArtists) => {
      let allArtistsArr = allArtists.docs.map((artist) => artist.data());
      setAllArtists(allArtistsArr);
    });
  }, []);
  return (
    <div className="artistsContainer">
      <h1>Artists</h1>
      {allArtists
        ? allArtists.map((artist, i) => {
            const website = artist.website || artist.web;
            const facebook = artist.facebook || artist.fb;
            const instagram = artist.instagram || artist.insta;
            return (
              <div key={i} className="artistsContainer">
                <h3>{artist.artist}</h3>
                
                <div className="textContainer">
                <img className="profile-pic" src={artist.picUrl} alt={artist.artist} />
                  <div id="bioFormat">{artist.bio}</div>
                  <h5> {artist.email}</h5>
                  <div className="artistContact">
                    {website ? (
                      <a href={website} target="_blank" rel="noreferrer noopener" aria-label="Website">
                        <img
                          src={websiteIcon}
                          alt=""
                          style={{ width: "50px" }}
                        ></img>
                      </a>
                    ) : (
                      ""
                    )}
                    {facebook ? (
                      <a href={facebook} target="_blank" rel="noreferrer noopener" aria-label="Facebook">
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
                      <a href={artist.youtube} target="_blank" rel="noreferrer noopener" aria-label="YouTube">
                        <img
                          src={youtubeIcon}
                          alt=""
                          style={{ width: "50px" }}
                        ></img>
                      </a>
                    ) : (
                      ""
                    )}
                    {instagram ? (
                      <a href={instagram} target="_blank" rel="noreferrer noopener" aria-label="Instagram">
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
                      <a href={artist.spotify} target="_blank" rel="noreferrer noopener" aria-label="Spotify">
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
