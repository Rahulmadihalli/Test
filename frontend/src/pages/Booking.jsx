import BookingForm from "../components/BookingForm.jsx";
import SectionHeading from "../components/SectionHeading.jsx";

function Booking() {
  return (
    <div className="page container">
      <SectionHeading
        title="Book Your Mehandi Artist"
        subtitle="Share your event details and we will confirm your slot within 24 hours."
      />
      <BookingForm />
    </div>
  );
}

export default Booking;

