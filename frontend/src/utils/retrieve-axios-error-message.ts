import { AxiosError } from "axios";
import {
  isAxiosErrorWithErrorField,
  isAxiosErrorWithExceptionField,
  isAxiosErrorWithMessageField,
} from "./type-guards";

/**
 * Retrieve the error message from an Axios error
 * @param error The error to render a toast for
 */
export const retrieveAxiosErrorMessage = (error: AxiosError) => {
  let errorMessage: string | null = null;

  if (isAxiosErrorWithErrorField(error) && error.response?.data.error) {
    errorMessage = error.response?.data.error;
  } else if (
    isAxiosErrorWithExceptionField(error) &&
    error.response?.data.exception
  ) {
    // Handle FastAPI-style error responses with "exception" field
    errorMessage = error.response?.data.exception;
  } else if (
    isAxiosErrorWithMessageField(error) &&
    error.response?.data.message
  ) {
    errorMessage = error.response?.data.message;
  } else {
    errorMessage = error.message;
  }

  return errorMessage;
};
