import { FormattedMessage } from "react-intl";
import "./header.css";

const Header = () => {
  return (
    <header className="database-header">
      <div className="text-container">
        <h1 className="header-title">
          <FormattedMessage
            id="database.header.title"
            defaultMessage="License Database"
          ></FormattedMessage>
        </h1>
        <p className="header-text">
          <FormattedMessage
            id="database.header.description"
            defaultMessage="Browse through available licenses in each of Boston's zip codes, view recent license applications as well as important information regarding each license type and important dates for license applications."
          ></FormattedMessage>
        </p>
        <p className="header-text">
          <FormattedMessage
            id="database.header.nextMeeting"
            defaultMessage="The next Licensing Boarding meeting is: <strong>{nextMeetingDate, date, medium}<strong>"
            values={{
              nextMeetingDate: new Date(),
              strong: (chunks: React.ReactNode) => <strong>{chunks}</strong>,
            }}
          ></FormattedMessage>
        </p>
      </div>
    </header>
  );
};

export default Header;
