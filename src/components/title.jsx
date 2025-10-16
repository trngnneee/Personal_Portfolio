export const Title = ({ title, subTitle }) => {
  return (
    <>
      <div className="text-white text-center font-bold text-[44px] main-text">
        {title}
      </div>
      <div className="text-[#CECECE] text-lg mb-8 text-center">{subTitle}</div>
    </>
  );
}