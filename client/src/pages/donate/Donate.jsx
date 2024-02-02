import "./donate.css";
import { useState, useEffect } from "react";
import { db } from "../../config/firebase";
import { collection, query, where, getDocs } from "firebase/firestore";

function Donate(props) {
  let [donorList, setDonorList] = useState([]);

  useEffect(() => {
    const donorsRef = query(collection(db, "donors"));
    getDocs(donorsRef).then((allDonors) => {
      console.log(allDonors.docs[0].data());
      let allDonorsArr = allDonors.docs.map((donor) => donor.data().name).sort((curr, next) => {
        return curr > next ? 1 : -1
      });
      setDonorList(allDonorsArr);
    });
  }, []);

  return (
    <div className="donate">
      <div className="donateWrapper">
        <a
          href="https://www.paypal.com/donate/?hosted_button_id=CU35GHQ4HTM6C"
          target="_blank"
          rel="noreferrer"
        >
          <h1 className="donate-link">Donate</h1>
        </a>
        <div className="copy">
          <b>
            An Invitation to become a Friend of the Artists of Phantom Theater
          </b>
          <br></br>
          <p>
            Historically, Phantom Theater has relied on local businesses and
            ticket sales to help performers cover travel and lodging, as well as
            a small honorarium for their creative work. Unfortunately, that
            honorarium often fell short in reimbursing the tremendous effort
            that goes into our artists’ innovative entertainment. Last year we
            started the <i>Friend of the Artists</i> initiative to help us offer
            more substantial support to our creative community who performs here
            at Phantom Theater.
          </p>
          <p>
            Will you join us this year as a <i>Friend of the Artists</i> and
            contribute what you can to this worthy cause? Your support will be
            acknowledged on our website and in our materials, and - more
            importantly - you will make a real difference to the people who
            enrich us all with their art.
          </p>

          <p>
            Thank you so very much for considering a contribution to Phantom
            Theater. .
            <br />
            <br />
            Every donation counts! And as a 501.c3 organization, every donation
            is also tax deductible. Please consider adding your name to the list
            of donors today! <br />
            Checks can be made out to: <br />
            Phantom Theater <br />
            PO Box 373, Warren, VT 05674.
          </p>
        </div>
        <div className="sponsorsWrapper">
          <h1>Friends of the Artists</h1>
          <p className="thankYou">
            PHANTOM THEATER IS PROUD TO COUNT MANY LOCAL BUSINESSES AND
            INDIVIDUALS AS FRIENDS AND SUPPORTERS. THANK YOU TO ALL OUR
            SPONSORS!
          </p>
          <br />
          <div className="sponsorsList">{donorList}</div>
          <div className="line"></div>
          <div className="sponsorHowTo">
            <div>
              Our sponsors help keep ticket prices low, make special events
              possible, and spread the word about the varied events we present
              each summer.
              <br />
              <br />
              Will you join us this year as a Friend of the Artists and
              contribute what you can to this worthy cause? You will make a real
              difference to the people who enrich us all with their art.
              <br />
              <br />
              <br></br>
              <p className="special">
                With gratitude,
                <br></br>
                The Phantom Theater Board
                <br></br>
                Lucas Bates, Claudia Becker, Beth Binns Schoellkopf, Laura
                Brines, MC DeBelina, Dan Eckstein, Janet Hubbard-Brown, Sheryl
                Kurland-Platt, Lexi Leacock, Tracy Martin, Mary Moffroid, Sucosh
                Norton, Jim Sanford, Bob Stauss, Kate Youngdahl
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

//------export the component---------
export default Donate;
