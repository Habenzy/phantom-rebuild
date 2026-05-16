import PropTypes from "prop-types";

export const nullShow = {
  title: "title",
  type: "type",
  blurb: "blurb",
  status: "proposed",
  dates: [],
  artists: [],
  contactName: "contactName",
  phone: "phone",
  email: "email",
  bio: "bio",
  description: "description",
  imageLg: "",
  imageLgName: "",
  image2: "",
  image2Name: "",
  image3: "",
  image3Name: "",
};

export const showDatePropType = PropTypes.shape({
  date: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  ticketLink: PropTypes.string,
  soldOut: PropTypes.bool,
});

export const showPropType = PropTypes.shape({
  id: PropTypes.string,
  title: PropTypes.string,
  type: PropTypes.string,
  status: PropTypes.string,
  description: PropTypes.string,
  contactName: PropTypes.string,
  artists: PropTypes.arrayOf(PropTypes.string),
  dates: PropTypes.arrayOf(showDatePropType),
  blurb: PropTypes.string,
  imageLg: PropTypes.string,
  image2: PropTypes.string,
  image3: PropTypes.string,
});

export const artistProfilePropType = PropTypes.shape({
  id: PropTypes.string,
  artist: PropTypes.string,
  phone: PropTypes.string,
  email: PropTypes.string,
  bio: PropTypes.string,
  web: PropTypes.string,
  fb: PropTypes.string,
  youtube: PropTypes.string,
  insta: PropTypes.string,
  spotify: PropTypes.string,
  picUrl: PropTypes.string,
});
