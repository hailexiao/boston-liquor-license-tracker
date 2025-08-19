import PageHeader from "@components/pages/coming-soon/pageheader.tsx";
import BackToHome from "@components/ui/back-to-home.tsx";
import { FormattedMessage } from "react-intl";
import styles from "./coming-soon.module.css";
import { useIntl } from "react-intl";

const ComingSoon = () => {
  const intl = useIntl();
  return (
    <main
      className={`${styles.comingSoonPage} coming-soon-page`}
      title={intl.formatMessage({ id: "comingSoon.backgroundImageAlt" })}
    >
      <PageHeader
        headerTitle={<FormattedMessage id="comingSoon.title" />}
        headerText={<FormattedMessage id="comingSoon.description" />}
      >
        <BackToHome />
      </PageHeader>
    </main>
  );
};

export default ComingSoon;
