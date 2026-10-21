import React, {useEffect} from "react";
import {Outlet} from "react-router-dom";
import {Api} from "../../services/eeg.service";
import {setOperators} from "../../redux/features/eegStateSlice";
import {useDispatch} from "react-redux";
import RegistrationProvider from "../../hooks/RegistrationContext";

const RegistrationPageLayout = () => {

  const dispatch = useDispatch()

  useEffect(() => {
    Api.eegService.getOperators().then(operators => dispatch(setOperators(operators)))
  }, [dispatch]);

  return (
    <RegistrationProvider><Outlet /></RegistrationProvider>
  );
};

export default RegistrationPageLayout;