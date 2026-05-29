import { useId, useState } from "react";
import PropTypes from "prop-types";
import { showDatePropType } from "./portalTypes";

export function DateField({ date, allDates, index, update }) {
  const fieldId = useId();
  const idFor = (fieldName) => `${fieldId}-${fieldName}`;
  const [dateTime, setDateTime] = useState(date.date || "");
  const [ticketLink, setTicketLink] = useState(date.ticketLink || "");
  const [soldOut, setSoldOut] = useState(date.soldOut || false);

  return (
    <div className="date-time-field">
      <label htmlFor={idFor("date-time")}>Choose a showtime</label>
      <input
        id={idFor("date-time")}
        type="datetime-local"
        name="date-time"
        data-testid="admin-show-date"
        value={dateTime}
        onChange={(evt) => {
          setDateTime(evt.target.value);
        }}
      />
      <label htmlFor={idFor("ticket-link")}>Link to tickets for this show time</label>
      <input
        id={idFor("ticket-link")}
        name="ticket-link"
        type="text"
        data-testid="admin-ticket-link"
        value={ticketLink}
        placeholder="Ticket Link"
        onChange={(evt) => {
          setTicketLink(evt.target.value);
        }}
      />
      <label htmlFor={idFor("sold-out")}>Show is Sold out</label>
      <input
        id={idFor("sold-out")}
        name="sold-out"
        type="checkbox"
        data-testid="admin-sold-out"
        checked={soldOut}
        onChange={(evt) => {
          setSoldOut(evt.target.checked);
        }}
      />
      <button
        data-testid="admin-confirm-show-time"
        className="submit highlight"
        onClick={(evt) => {
          evt.preventDefault();
          const upDate = allDates.toSpliced(index, 1, {
            date: dateTime,
            ticketLink,
            soldOut,
          });
          update(upDate);
        }}
      >
        Confirm Show Time
      </button>
    </div>
  );
}

DateField.propTypes = {
  date: showDatePropType.isRequired,
  allDates: PropTypes.arrayOf(showDatePropType).isRequired,
  index: PropTypes.number.isRequired,
  update: PropTypes.func.isRequired,
};
