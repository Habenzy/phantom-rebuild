import { useState, useEffect } from "react";
import { db } from "../../config/firebase";
import { collection, query, getDocs } from "firebase/firestore";
import websiteIcon from "../../assets/internet.png";
import facebookIcon from "../../assets/facebookb.png";
import youtubeIcon from "../../assets/youtube.png";
import instagramIcon from "../../assets/instagramColor.png";
import spotifyIcon from "../../assets/spotify.png";
import { safeOptionalUrl } from "../../utils/safeUrl";
import "./artists.css";

function ArtistsList() {
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
      {allArtists.map((artist, i) => {
            const website = safeOptionalUrl(artist.website || artist.web);
            const facebook = safeOptionalUrl(artist.facebook || artist.fb);
            const instagram = safeOptionalUrl(artist.instagram || artist.insta);
            const youtube = safeOptionalUrl(artist.youtube);
            const spotify = safeOptionalUrl(artist.spotify);
            return (
              <div key={i} className="artistsContainer">
                <h3>{artist.artist}</h3>

                <div className="textContainer">
                  <img
                    className="profile-pic"
                    src={artist.picUrl}
                    alt={artist.artist}
                  />
                  <div id="bioFormat">{artist.bio}</div>
                  <h5> {artist.email}</h5>
                  <div className="artistContact">
                    {website ? (
                      <a
                        href={website}
                        target="_blank"
                        rel="noreferrer noopener"
                        aria-label="Website"
                      >
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
                      <a
                        href={facebook}
                        target="_blank"
                        rel="noreferrer noopener"
                        aria-label="Facebook"
                      >
                        <img
                          src={facebookIcon}
                          alt=""
                          style={{ width: "50px" }}
                        ></img>
                      </a>
                    ) : (
                      ""
                    )}
                    {youtube ? (
                      <a
                        href={youtube}
                        target="_blank"
                        rel="noreferrer noopener"
                        aria-label="YouTube"
                      >
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
                      <a
                        href={instagram}
                        target="_blank"
                        rel="noreferrer noopener"
                        aria-label="Instagram"
                      >
                        <img
                          src={instagramIcon}
                          alt=""
                          style={{ width: "50px" }}
                        ></img>
                      </a>
                    ) : (
                      ""
                    )}
                    {spotify ? (
                      <a
                        href={spotify}
                        target="_blank"
                        rel="noreferrer noopener"
                        aria-label="Spotify"
                      >
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
          })}
    </div>
  );
}

export default ArtistsList;
