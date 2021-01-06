/**
 * TagSpaces - universal file and folder organizer
 * Copyright (C) 2017-present TagSpaces UG (haftungsbeschraenkt)
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License (version 3) as
 * published by the Free Software Foundation.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU Affero General Public License for more details.
 *
 * You should have received a copy of the GNU Affero General Public License
 * along with this program.  If not, see <https://www.gnu.org/licenses/>.
 *
 */

import React, { useEffect, useState } from 'react';
import { bindActionCreators } from 'redux';
import uuidv1 from 'uuid';
import classNames from 'classnames';
import { connect } from 'react-redux';
import { withStyles } from '@material-ui/core/styles';
import List from '@material-ui/core/List';
import MoreVertIcon from '@material-ui/icons/MoreVert';
import Typography from '@material-ui/core/Typography';
import IconButton from '@material-ui/core/IconButton';
import Button from '@material-ui/core/Button';
import styles from './SidePanels.css';
import LocationManagerMenu from './menus/LocationManagerMenu';
import ConfirmDialog from './dialogs/ConfirmDialog';
import SelectDirectoryDialog from './dialogs/SelectDirectoryDialog';
import CreateDirectoryDialog from './dialogs/CreateDirectoryDialog';
import CustomLogo from './CustomLogo';
import {
  actions as LocationActions,
  getLocations,
  locationType,
  Location
} from '../reducers/locations';
import { actions as AppActions } from '../reducers/app';
import { getPerspectives } from '-/reducers/settings';
import i18n from '../services/i18n';
import AppConfig from '../config';
import PlatformIO from '../services/platform-io';
import LoadingLazy from '-/components/LoadingLazy';
import LocationView from '-/components/LocationView';

const CreateLocationDialog = React.lazy(() =>
  import(
    /* webpackChunkName: "CreateLocationDialog" */ './dialogs/CreateLocationDialog'
  )
);
const CreateLocationDialogAsync = props => (
  <React.Suspense fallback={<LoadingLazy />}>
    <CreateLocationDialog {...props} />
  </React.Suspense>
);

const EditLocationDialog = React.lazy(() =>
  import(
    /* webpackChunkName: "CreateLocationDialog" */ './dialogs/EditLocationDialog'
  )
);
const EditLocationDialogAsync = props => (
  <React.Suspense fallback={<LoadingLazy />}>
    <EditLocationDialog {...props} />
  </React.Suspense>
);

interface Props {
  classes: any;
  style: any;
  locations: Array<Location>;
  perspectives: Array<Object>;
  // currentLocationId: string;
  hideDrawer: () => void;
  openURLExternally: (path: string) => void;
  openFileNatively: (path: string) => void;
  // openDirectory: (path: string) => void;
  toggleOpenLinkDialog: () => void;
  addLocation: (location: Location, openAfterCreate?: boolean) => void;
  editLocation: () => void;
  removeLocation: (location: Location) => void;
}

type SubFolder = {
  uuid: string;
  name: string;
  path: string;
  children?: Array<SubFolder>;
};

const LocationManager = (props: Props) => {
  // const directoryTreeRef = useRef([]);

  const [
    locationManagerMenuAnchorEl,
    setLocationManagerMenuAnchorEl
  ] = useState<null | HTMLElement>(null);
  const [selectedLocation, setSelectedLocation] = useState<Location>(null);
  const [selectedDirectoryPath, setSelectedDirectoryPath] = useState<string>(
    null
  );
  const [
    isCreateLocationDialogOpened,
    setCreateLocationDialogOpened
  ] = useState<boolean>(false);
  const [isEditLocationDialogOpened, setEditLocationDialogOpened] = useState<
    boolean
  >(false);
  const [
    isDeleteLocationDialogOpened,
    setDeleteLocationDialogOpened
  ] = useState<boolean>(false);
  const [
    isCreateDirectoryDialogOpened,
    setCreateDirectoryDialogOpened
  ] = useState<boolean>(false);
  const [
    isSelectDirectoryDialogOpened,
    setSelectDirectoryDialogOpened
  ] = useState<boolean>(false);

  useEffect(() => {
    // directoryTreeRef.current = directoryTreeRef.current.slice(0, props.locations.length);
    if (props.locations.length < 1) {
      // init locations
      const devicePaths = PlatformIO.getDevicePaths();

      Object.keys(devicePaths).forEach(key => {
        props.addLocation(
          {
            uuid: uuidv1(),
            type: locationType.TYPE_LOCAL,
            name: key, // TODO use i18n
            path: devicePaths[key],
            isDefault: AppConfig.isWeb && devicePaths[key] === '/files/', // Used for the web ts demo
            isReadOnly: false,
            persistIndex: false
          },
          false
        );
      });
    }
  }, []); // props.locations]);

  const createNewDirectoryExt = (path: string) => {
    setCreateDirectoryDialogOpened(true);
    setSelectedDirectoryPath(path);
  };

  const showSelectDirectoryDialog = () => {
    setSelectDirectoryDialogOpened(true);
    setSelectedDirectoryPath('');
  };

  const chooseDirectoryPath = (currentPath: string) => {
    setSelectDirectoryDialogOpened(true);
    setSelectedDirectoryPath(currentPath);
  };

  const handleLocationManagerMenu = (event: any) => {
    setLocationManagerMenuAnchorEl(event.currentTarget);
  };

  const handleCloseLocationManagerMenu = () => {
    setLocationManagerMenuAnchorEl(null);
  };

  const { classes } = props;
  return (
    <div className={classes.panel} style={props.style}>
      <CustomLogo />
      <div className={classes.toolbar}>
        <Typography
          className={classNames(classes.panelTitle, classes.header)}
          variant="subtitle1"
        >
          {i18n.t('core:locationManager')}
        </Typography>
        <IconButton
          data-tid="locationManagerMenu"
          onClick={handleLocationManagerMenu}
        >
          <MoreVertIcon />
        </IconButton>
      </div>
      <LocationManagerMenu
        anchorEl={locationManagerMenuAnchorEl}
        open={Boolean(locationManagerMenuAnchorEl)}
        onClose={handleCloseLocationManagerMenu}
        openURLExternally={props.openURLExternally}
        showCreateLocationDialog={() => {
          setLocationManagerMenuAnchorEl(null);
          setCreateLocationDialogOpened(true);
        }}
        toggleOpenLinkDialog={props.toggleOpenLinkDialog}
      />
      {!AppConfig.locationsReadOnly && (
        <div
          style={{
            width: '100%',
            textAlign: 'center',
            marginBottom: 10
          }}
        >
          <Button
            data-tid="createNewLocation"
            onClick={() => setCreateLocationDialogOpened(true)}
            title={i18n.t('core:createLocationTitle')}
            className={classes.mainActionButton}
            size="small"
            variant="outlined"
            color="primary"
            style={{ width: '95%' }}
          >
            {/* <CreateLocationIcon className={classNames(classes.leftIcon)} /> */}
            {i18n.t('core:createLocationTitle')}
          </Button>
        </div>
      )}
      <div>
        {isCreateLocationDialogOpened && (
          <CreateLocationDialogAsync
            // key={createLocationDialogKey}
            open={isCreateLocationDialogOpened}
            onClose={() => setCreateLocationDialogOpened(false)}
            addLocation={props.addLocation}
            showSelectDirectoryDialog={showSelectDirectoryDialog}
          />
        )}
        {isEditLocationDialogOpened && (
          <EditLocationDialogAsync
            // key={this.state.editLocationDialogKey}
            open={isEditLocationDialogOpened}
            onClose={() => setEditLocationDialogOpened(false)}
            location={selectedLocation}
            editLocation={props.editLocation}
            showSelectDirectoryDialog={showSelectDirectoryDialog}
            selectedDirectoryPath={selectedDirectoryPath}
          />
        )}
        {isDeleteLocationDialogOpened && (
          <ConfirmDialog
            open={isDeleteLocationDialogOpened}
            onClose={() => setDeleteLocationDialogOpened(false)}
            title={i18n.t('core:deleteLocationTitleAlert')}
            content={i18n.t('core:deleteLocationContentAlert', {
              locationName: selectedLocation ? selectedLocation.name : ''
            })}
            confirmCallback={result => {
              if (result && selectedLocation) {
                props.removeLocation(selectedLocation);
                /* directoryTreeRef.current[
                  selectedLocation.uuid
                ].removeLocation(); */
              }
            }}
            cancelDialogTID="cancelDeleteLocationDialog"
            confirmDialogTID="confirmDeleteLocationDialog"
          />
        )}
        {isSelectDirectoryDialogOpened && (
          <SelectDirectoryDialog
            open={isSelectDirectoryDialogOpened}
            onClose={() => setSelectDirectoryDialogOpened(false)}
            createNewDirectoryExt={createNewDirectoryExt}
            chooseDirectoryPath={chooseDirectoryPath}
          />
        )}
        {isCreateDirectoryDialogOpened && (
          <CreateDirectoryDialog
            open={isCreateDirectoryDialogOpened}
            onClose={() => setCreateDirectoryDialogOpened(false)}
            selectedDirectoryPath={selectedDirectoryPath}
          />
        )}
        <List
          className={classes.locationListArea}
          data-tid="locationList"
          style={{
            maxHeight: 'calc(100vh - 175px)',
            // @ts-ignore
            overflowY: AppConfig.isFirefox ? 'auto' : 'overlay'
          }}
        >
          {props.locations.map(location => (
            <LocationView
              key={location.uuid}
              classes={props.classes}
              location={location}
              hideDrawer={props.hideDrawer}
              setEditLocationDialogOpened={setEditLocationDialogOpened}
              setDeleteLocationDialogOpened={setDeleteLocationDialogOpened}
              selectedLocation={selectedLocation}
              setSelectedLocation={setSelectedLocation}
            />
          ))}
        </List>
      </div>
    </div>
  );
};

function mapStateToProps(state) {
  return {
    locations: getLocations(state),
    // currentLocationId: getCurrentLocationId(state),
    perspectives: getPerspectives(state)
  };
}

function mapDispatchToProps(dispatch) {
  return bindActionCreators(
    {
      addLocation: LocationActions.addLocation,
      editLocation: LocationActions.editLocation,
      removeLocation: LocationActions.removeLocation,
      // openDirectory: AppActions.openDirectory,
      openFileNatively: AppActions.openFileNatively,
      toggleOpenLinkDialog: AppActions.toggleOpenLinkDialog,
      openURLExternally: AppActions.openURLExternally
    },
    dispatch
  );
}

export default withStyles(styles)(
  // @ts-ignore
  connect(mapStateToProps, mapDispatchToProps)(LocationManager)
);
