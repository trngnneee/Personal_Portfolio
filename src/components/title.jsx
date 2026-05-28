export const Title = ({ title, subTitle }) => {
  return (
    <>
      <div className="text-white text-center font-bold text-[23px] sm:text-[44px] main-text">
        {title}
      </div>
      <div className="text-[#CECECE] text-sm sm:text-lg mb-8 text-center">{subTitle}</div>
    </>
  );
}