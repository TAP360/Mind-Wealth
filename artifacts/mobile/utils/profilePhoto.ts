import * as ImagePicker from 'expo-image-picker';
import { Directory, File, Paths } from 'expo-file-system';
import { Alert, Linking, Platform } from 'react-native';

type Translate = (key: string) => string;
type PhotoSource = 'camera' | 'gallery';

async function selectProfilePhoto(
  source: PhotoSource,
  t: Translate,
  onPhotoSelected: (uri: string) => Promise<void> | void,
) {
  try {
    if (Platform.OS !== 'web') {
      const permission =
        source === 'camera'
          ? await ImagePicker.requestCameraPermissionsAsync()
          : await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permission.granted) {
        Alert.alert(t('personal.photoPermissionDenied'), t('personal.photoPermissionMessage'), [
          ...(permission.canAskAgain
            ? [
                {
                  text: t('personal.photoTryAgain'),
                  onPress: () => {
                    void selectProfilePhoto(source, t, onPhotoSelected);
                  },
                },
              ]
            : [
                {
                  text: t('personal.photoSettings'),
                  onPress: () => {
                    void Linking.openSettings().catch(() => {
                      Alert.alert(t('personal.photoError'), t('personal.photoErrorMessage'));
                    });
                  },
                },
              ]),
          { text: t('common.ok'), style: 'cancel' },
        ]);
        return;
      }
    }

    const options: ImagePicker.ImagePickerOptions = {
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.72,
      base64: Platform.OS === 'web',
    };
    const result =
      source === 'camera'
        ? await ImagePicker.launchCameraAsync(options)
        : await ImagePicker.launchImageLibraryAsync(options);
    if (result.canceled || !result.assets[0]) return;

    const asset = result.assets[0];
    let savedUri: string;
    if (Platform.OS === 'web') {
      if (!asset.base64) throw new Error('The selected image could not be encoded.');
      const mimeType = asset.mimeType || 'image/jpeg';
      savedUri = `data:${mimeType};base64,${asset.base64}`;
    } else {
      const extension =
        asset.mimeType?.split('/')[1]?.replace('jpeg', 'jpg') ??
        asset.fileName?.split('.').pop() ??
        'jpg';
      const destination = new File(
        new Directory(Paths.document),
        `bassera-profile-photo-${Date.now()}.${extension}`,
      );
      await new File(asset.uri).copy(destination, { overwrite: true });
      savedUri = destination.uri;
    }

    await onPhotoSelected(savedUri);
  } catch {
    if (Platform.OS === 'web') {
      window.alert(`${t('personal.photoError')}\n${t('personal.photoErrorMessage')}`);
    } else {
      Alert.alert(t('personal.photoError'), t('personal.photoErrorMessage'));
    }
  }
}

export function showProfilePhotoOptions(
  t: Translate,
  onPhotoSelected: (uri: string) => Promise<void> | void,
) {
  const choose = (source: PhotoSource) => {
    void selectProfilePhoto(source, t, onPhotoSelected);
  };

  if (Platform.OS === 'web') {
    const choice = window.prompt(
      t('personal.photoSourcePrompt'),
      t('personal.photoGallery'),
    );
    const normalized = choice?.trim().toLowerCase();
    if (
      normalized === t('personal.photoCamera').trim().toLowerCase() ||
      normalized === 'camera'
    ) {
      choose('camera');
    } else if (
      normalized === t('personal.photoGallery').trim().toLowerCase() ||
      normalized === 'gallery'
    ) {
      choose('gallery');
    }
    return;
  }

  Alert.alert(t('personal.changePhoto'), undefined, [
    { text: t('personal.photoCamera'), onPress: () => choose('camera') },
    { text: t('personal.photoGallery'), onPress: () => choose('gallery') },
    { text: t('common.cancel'), style: 'cancel' },
  ]);
}